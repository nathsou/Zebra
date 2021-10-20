import { coreOf } from "../../Core/Casify";
import { coreExprFreeVars, varEnvOf } from "../../Core/ExprOfFunDecls";
import { isPrimitiveFunc, PrimitiveFunction, primitives } from "../../Inferencer/Primitives";
import { isVar, Pattern, vars } from "../../Interpreter/Pattern";
import { Decl } from "../../Parser/Decl";
import { Expr } from "../../Parser/Expr";
import { renameVars } from '../../Parser/RenameVars';
import { symbolRenameMap } from "../../Parser/Symbols";
import { defined } from "../../Utils/Common";
import { crocoPrimitives } from "./CrocoPrimitives";

const camel = (f: string): string => {
  return `${f[0].toUpperCase()}${f.slice(1)}`;
};

const rename = (f: string): string => {
  if (f === 'main') return 'Main';

  // @ts-ignore
  return `Ze${camel(f.replaceAll('_', ''))}`
    .split('')
    .map(c => symbolRenameMap.has(c) ?
      (c === '_' ? 'U' : `${camel(defined(symbolRenameMap.get(c)))}`) :
      c
    )
    .join('');
};

const usedPrimitives = new Set<PrimitiveFunction>();

export const crocoProgramOf = (prog: Decl[]): string => {
  usedPrimitives.clear();

  const topLevelFuncs: string[] = [];
  const funcNames = new Set<string>();

  // collect function names
  for (const decl of prog) {
    if (decl.type === 'fun') {
      funcNames.add(decl.funName.name);
    }
  }

  const decls = prog
    .map(decl => crocoDeclOf(decl, topLevelFuncs, funcNames))
    .filter(s => s.length > 0);

  const primFuncs = [...usedPrimitives]
    .map(f => defined(crocoPrimitives().get(f)));

  return [primFuncs, topLevelFuncs, decls]
    .map(v => v.join('\n'))
    .join('\n');
};

export const crocoDeclOf = (
  decl: Decl,
  topLevelFuncs: string[],
  funcNames: Set<string>
): string => {
  switch (decl.type) {
    case 'datatype':
    case 'typeclass':
    case 'instance':
    case 'import':
    case 'export':
      return '';

    case 'fun':
      const name = rename(decl.funName.name);
      const args = decl.args.map(crocoPatternOf).join(' ');
      const body = crocoExprOf(decl.body, topLevelFuncs, funcNames);
      return `${name} ${args} = ${body}`;
  }
};

export const crocoPatternOf = (pattern: Pattern): string => {
  if (isVar(pattern)) return pattern.value;

  if (pattern.name === 'Nil') return '[]';
  if (pattern.name === 'Cons') {
    const [h, tl] = pattern.args;
    return `(${crocoPatternOf(h)}:${crocoPatternOf(tl)})`;
  }

  if (pattern.name === 'tuple') return `(${pattern.args.map(crocoPatternOf).join(', ')})`;
  if (pattern.name[0] === "'") return pattern.name.charCodeAt(1).toString();
  if (pattern.args.length === 0) return camel(pattern.name);

  return `(${camel(pattern.name)} ${pattern.args.map(crocoPatternOf).join(' ')})`;
};

export const crocoExprOf = (expr: Expr, topLevelFuncs: string[], funcNames: Set<string>): string => {
  switch (expr.type) {
    case 'variable':
      if (isPrimitiveFunc(expr.name)) {
        usedPrimitives.add(expr.name);
        return rename(expr.name);
      }

      if (funcNames.has(expr.name)) {
        return rename(expr.name);
      }

      return expr.name;
    case 'tyconst':
      if (expr.args.length === 0) return camel(expr.name);
      if (expr.name === 'tuple') return `(${expr.args.map(a => crocoExprOf(a, topLevelFuncs, funcNames)).join(', ')})`;
      return `(${camel(expr.name)} ${expr.args.map(a => crocoExprOf(a, topLevelFuncs, funcNames)).join(' ')})`;
    case 'let_in': {
      const left = crocoPatternOf(expr.left);
      const middle = crocoExprOf(expr.middle, topLevelFuncs, funcNames);
      const right = crocoExprOf(expr.right, topLevelFuncs, funcNames);
      return `let ${left} = ${middle} in ${right}`;
    }
    case 'let_rec_in': {
      const name = `LetRec${topLevelFuncs.length}`;
      const left = crocoPatternOf(expr.arg);
      const middle = crocoExprOf(renameVars(expr.middle, { [expr.funName.name]: name }), topLevelFuncs, funcNames);
      const right = crocoExprOf(renameVars(expr.right, { [expr.funName.name]: name }), topLevelFuncs, funcNames);
      topLevelFuncs.push(`${name} ${left} = ${middle}`);

      return right;
    }
    case 'if_then_else':
      const cond = crocoExprOf(expr.cond, topLevelFuncs, funcNames);
      const thenBranch = crocoExprOf(expr.thenBranch, topLevelFuncs, funcNames);
      const elseBranch = crocoExprOf(expr.elseBranch, topLevelFuncs, funcNames);

      return `(if ${cond} then ${thenBranch} else ${elseBranch})`;
    case 'constant':
      switch (expr.kind) {
        case 'integer':
        case 'float':
          return `${expr.value}`;
        case 'char':
          return `${expr.value.charCodeAt(0)}`;
      }
    case 'case_of': {
      const name = `CaseOf${topLevelFuncs.length}`;

      const freeVars = new Set<string>();

      // collect free variables
      for (const c of expr.cases) {
        const fv = coreExprFreeVars(
          coreOf(c.expr),
          varEnvOf(
            ...[...vars(c.pattern)].map(v => v.value),
            ...funcNames,
            ...primitives.keys()
          ));

        for (const v of fv) {
          if (v[0] === v[0].toLowerCase()) {
            freeVars.add(v);
          }
        }
      }

      const freeVarsArgs = [...freeVars].join(' ');

      for (const c of expr.cases) {
        const pat = crocoPatternOf(c.pattern);
        const e = crocoExprOf(c.expr, topLevelFuncs, funcNames);
        topLevelFuncs.push(`${name} ${pat} ${freeVarsArgs} = ${e}`);
      }

      const val = crocoExprOf(expr.value, topLevelFuncs, funcNames);

      if (freeVarsArgs === '') {
        return `(${name} ${val})`;
      }

      return `(${name} ${val} ${freeVarsArgs})`;
    }
    case 'lambda': {
      const arg = crocoPatternOf(expr.arg);
      const body = crocoExprOf(expr.body, topLevelFuncs, funcNames);
      return `(\\${arg} -> ${body})`;
    }
    case 'app': {
      const lhs = crocoExprOf(expr.lhs, topLevelFuncs, funcNames);
      const rhs = crocoExprOf(expr.rhs, topLevelFuncs, funcNames);
      return `(${lhs} ${rhs})`;
    }
  }
};
