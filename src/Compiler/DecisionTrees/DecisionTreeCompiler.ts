import { CoreCaseOfExpr, CoreCaseOfExprCase } from "../../Core/CoreExpr";
import { isVar, Pattern } from "../../Interpreter/Pattern";
import { Value } from "../../Interpreter/Value";
import { decons, Dict, dictSet, gen, head, indexed, repeat, setEq, swapMut, tail, unreachable, zip } from "../../Utils/Common";
import { isSome, Maybe } from "../../Utils/Maybe";
import { primitiveOf } from "../Primitive/PrimitiveCompiler";
import { PrimExpr, PrimSubtermOccurence } from "../Primitive/PrimitiveExpr";
import { DecisionTree, makeFail, makeLeaf, makeSwitch, Switch } from "./DecisionTree";

// Based on "Compiling Pattern Matching to Good Decision Trees" by Luc Maranget

export type AnyPat = '_';
export const anyPat: AnyPat = '_';

export type DTFunPattern = { name: string, args: DTPattern[] };
export type DTPattern = DTFunPattern | AnyPat;

type ClauseMatrixRow = DTPattern[];
type ClauseMatrixColumn = DTPattern[];

export type ClauseMatrix = {
  dims: [number, number],
  patterns: ClauseMatrixRow[],
  actions: {
    bindings: Dict<PrimSubtermOccurence>,
    action: PrimExpr
  }[]
};

export const dtPatternOf = (p: Pattern): DTPattern => {
  if (isVar(p) || p.name === '_') return anyPat;
  return { name: p.name, args: p.args.map(dtPatternOf) };
};

const clauseMatrixRowOf = (p: Pattern): ClauseMatrixRow => {
  // if (isFun(p) && p.name === 'tuple') {
  //     return p.args.map(dtPatternOf);
  // }

  return [dtPatternOf(p)];
};

export const subtermsOccurences = (
  p: Pattern,
  sigma: Dict<PrimSubtermOccurence> = {},
  subTermIndex = 0
): Dict<PrimSubtermOccurence> => {
  if (isVar(p)) {
    return dictSet(sigma, p.value, {
      type: 'subterm',
      index: subTermIndex,
      pos: []
    });
  }

  for (const [t, i] of indexed(p.args)) {
    collectBindings(t, sigma, i, {
      type: 'subterm',
      index: subTermIndex,
      pos: []
    });
  }

  return sigma;
};

export const collectBindings = (
  p: Pattern,
  sigma: Dict<PrimSubtermOccurence>,
  localOffset = 0,
  parent: PrimSubtermOccurence
): void => {
  const occ: PrimSubtermOccurence = {
    type: 'subterm',
    index: parent.index,
    pos: [...parent.pos, localOffset]
  };

  if (isVar(p)) {
    sigma[p.value] = occ;
  } else {
    for (const [s, idx] of indexed(p.args)) {
      collectBindings(s, sigma, idx, occ);
    }
  }
};

const actionOf = ({ expr, pattern }: CoreCaseOfExprCase) => {
  const subst: Dict<PrimSubtermOccurence> = {};

  // const args = isFun(pattern) && pattern.name === 'tuple' ?
  //     pattern.args :
  //     [pattern];

  const args = [pattern];

  // for (const [arg, idx] of indexed(args)) {
  //     subtermsOccurences(arg, subst, idx);
  // }

  subtermsOccurences(args[0], subst, -1);

  return { action: primitiveOf(expr), bindings: subst };
};

// all the rules must share the same head symbol and arity
export const clauseMatrixOf = (expr: CoreCaseOfExpr): ClauseMatrix => {
  const patterns = expr.cases.map(c => clauseMatrixRowOf(c.pattern));

  return {
    patterns,
    dims: [expr.cases.length, patterns[0].length], // rows * cols
    actions: expr.cases.map(actionOf)
  };
};

const specializeRow = (
  row: ClauseMatrixRow,
  ctor: string,
  arity: number
): Maybe<ClauseMatrixRow> => {
  const [p, ps] = decons(row);
  if (p === anyPat) return [...repeat(anyPat, arity), ...ps];
  if (p.name === ctor) return [...p.args, ...ps];
};

export const specializeClauseMatrix = (
  matrix: ClauseMatrix,
  ctor: string,
  arity: number
): ClauseMatrix => {
  const patterns = matrix.patterns
    .map(row => specializeRow(row, ctor, arity));

  const actions = [...zip(patterns, matrix.actions)]
    .filter(([p, _a]) => p)
    .map(([_p, a]) => a);

  return {
    patterns: patterns.filter(isSome),
    dims: [actions.length, arity + matrix.dims[1] - 1],
    actions
  };
};

const defaultRow = (row: ClauseMatrixRow): Maybe<ClauseMatrixRow> => {
  const [p, ps] = decons(row);
  if (p === anyPat) return ps;
};

export const defaultClauseMatrix = (matrix: ClauseMatrix): ClauseMatrix => {
  const patterns = matrix.patterns.map(defaultRow);

  const actions = [...zip(patterns, matrix.actions)]
    .filter(([p, _a]) => p)
    .map(([_p, a]) => a);

  return {
    patterns: patterns.filter(isSome),
    dims: [actions.length, matrix.dims[1] - 1],
    actions
  };
};

const getColumn = (matrix: ClauseMatrix, i: number): ClauseMatrixColumn => {
  const col: DTPattern[] = [];
  for (const row of matrix.patterns) {
    col.push(row[i]);
  }
  return col;
};

const selectColumn = (matrix: ClauseMatrix): number => {
  for (let i = 0; i < matrix.dims[1]; i++) {
    if (getColumn(matrix, i).some(p => p !== anyPat)) {
      return i;
    }
  }

  unreachable('No valid column found');
  return 0;
};

const swapColumn = (matrix: ClauseMatrix, i: number): void => {
  for (const row of matrix.patterns) {
    swapMut(row, 0, i);
  }
};

const heads = (patterns: DTPattern[]): Map<string, number> => {
  const hds = new Map<string, number>();

  for (const p of patterns) {
    if (p !== anyPat) {
      hds.set(p.name, p.args.length);
    }
  }

  return hds;
};

// pos of h in A(B(c, d, E(f, G(h)))) is [0, 2, 1, 0]
export type Occcurence = {
  value: Value,
  pos: number[]
};

export type IndexedOccurence = {
  index: number,
  pos: number[]
};

let argIndex = 0;

export const compileClauseMatrix = (
  argsCount: number,
  matrix: ClauseMatrix,
  signature: Set<string>
): DecisionTree => {
  // const occurences = [...gen(argsCount, i => ({ index: i, pos: [] }))];
  const occurences = [{ index: -1, pos: [], argIndex: argIndex++ }];
  return compileClauseMatrixAux(occurences, matrix, signature);
};

const compileClauseMatrixAux = (
  occurences: IndexedOccurence[],
  matrix: ClauseMatrix,
  signature: Set<string>
): DecisionTree => {
  const [m, n] = matrix.dims;
  if (m === 0) return makeFail();
  if (m > 0 && (n === 0 || matrix.patterns[0].every(p => p === anyPat))) {
    return makeLeaf(matrix.actions[0].action, matrix.actions[0].bindings);
  }

  const colIdx = selectColumn(matrix);

  if (colIdx !== 0) {
    swapMut(occurences, 0, colIdx);
    swapColumn(matrix, colIdx);
  }

  const col = getColumn(matrix, 0);
  const hds = heads(col);
  const tests: Switch['tests'] = [];

  for (const [ctor, arity] of hds) {
    const o1: IndexedOccurence[] = [...gen(arity, i => ({
      index: occurences[0].index,
      pos: [...occurences[0].pos, i],
      argIndex: 0
    }))];

    const A_k = compileClauseMatrixAux(
      [...o1, ...tail(occurences)],
      specializeClauseMatrix(matrix, ctor, arity),
      signature
    );

    tests.push([ctor, A_k]);
  }

  if (!setEq(hds, signature)) {
    const A_D = compileClauseMatrixAux(
      tail(occurences),
      defaultClauseMatrix(matrix),
      signature
    );

    tests.push([anyPat, A_D]);
  }

  return makeSwitch(head(occurences), tests);
};