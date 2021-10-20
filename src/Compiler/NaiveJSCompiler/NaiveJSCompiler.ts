import { CoreDecl } from "../../Core/CoreDecl";
import { context } from "../../Inferencer/Context";
import { isPrimitiveFunc, PrimitiveFunction } from "../../Inferencer/Primitives";
import { lambdaOf } from "../../Parser/Sugar";
import { symbolRenameMap } from '../../Parser/Symbols';
import { defined, head, tail } from "../../Utils/Common";
import { DecisionTree } from "../DecisionTrees/DecisionTree";
import { IndexedOccurence } from "../DecisionTrees/DecisionTreeCompiler";
import { primitiveProgramOfCore } from "../Primitive/PrimitiveCompiler";
import { PrimDecl } from "../Primitive/PrimitiveDecl";
import { PrimExpr } from "../Primitive/PrimitiveExpr";
import { jsPrimitives } from "./JSPrimitives";

export const rename = (f: string): string => {
  if (f === 'eval') return 'eval_';

  return f
    .split('')
    .map(c => symbolRenameMap.has(c) ? (c === '_' ? '_' : `_${symbolRenameMap.get(c)}_`) : c)
    .join('');
};

const usedPrimitives = new Set<PrimitiveFunction>();

export const naiveJsProgramOf = (prog: CoreDecl[]): string => {
  usedPrimitives.clear();

  const out: string[] = [];

  const prim = primitiveProgramOfCore(prog);

  for (const decl of prim) {
    if (
      decl.type === 'fun' ||
      context.datatypes.has(decl.name)
    ) {
      out.push(naiveJsDeclOf(decl));
    }
  }

  const primitives = [...usedPrimitives]
    .map(f => defined(jsPrimitives().get(f)).trim());

  return [primitives, out].map(l => l.join('\n\n')).join('\n\n');
};

const naiveJsDeclOf = (d: PrimDecl): string => {
  switch (d.type) {
    case 'fun':
      if (d.args.length === 0) {
        if (context.datatypes.has(d.name)) {
          return `const ${rename(d.name)} = { name: "${d.name}", args: [] };`
        } else {
          return `const ${rename(d.name)} = ${naiveJsExprOf(d.body)};`;
        }
      }

      const as = tail(d.args);
      return `function ${rename(d.name)}(${head(d.args) ?? ''}) {
                return ${naiveJsExprOf(as.length > 0 ? lambdaOf(as, d.body) : d.body)};
            }`;
  }
};

const naiveJsExprOf = (e: PrimExpr): string => {
  switch (e.type) {
    case 'variable':
      if (e.name === 'True') return 'true';
      if (e.name === 'False') return 'false';

      if (isPrimitiveFunc(e.name)) {
        usedPrimitives.add(e.name);
        return e.name;
      }

      return rename(e.name);
    case 'tyconst':
      return `({ name: "${e.name}", args: [${e.args.map(naiveJsExprOf).join(', ')}] })`;
    case 'lambda':
      return `(${e.arg} => ${naiveJsExprOf(e.body)})`;
    case 'let_in':
      return `(${e.left} => ${naiveJsExprOf(e.right)})(${naiveJsExprOf(e.middle)})`;
    case 'let_rec_in':
      const f = rename(e.funName);
      return `(${f} => ${naiveJsExprOf(e.right)})(function ${f}(${e.arg}) {\n return ${naiveJsExprOf(e.middle)}; \n})`;
    case 'if_then_else':
      return `${naiveJsExprOf(e.cond)} ? ${naiveJsExprOf(e.thenBranch)} : ${naiveJsExprOf(e.elseBranch)}`;
    case 'app':
      return `${naiveJsExprOf(e.lhs)}(${naiveJsExprOf(e.rhs)})`;
    case 'subterm':
      return occurenceOf(e);
    case 'constant':
      switch (e.kind) {
        case 'integer':
        case 'float':
          return `${e.value}`;
        case 'char':
          return `'${e.value}'`;
      }
    case 'switch':
      return `(arg => { \n ${naiveJsOfDecisionTree(e.dt)} \n })(${naiveJsExprOf(e.value)})`;
  }
};

const occurenceOf = (occ: IndexedOccurence): string => {
  let v = occ.index === -1 ? `arg` : `arg.args[${occ.index}]`;

  for (const p of occ.pos) {
    v = `${v}.args[${p}]`;
  }

  return v;
};

const isNat = (n: string) => /[0-9]+/.test(n);
const isChar = (c: string) => c[0] === "'";
const isBool = (s: string) => s === 'True' || s === 'False';

const nativeRepr = (ctor: string) => {
  if (isNat(ctor)) return ctor;
  if (isBool(ctor)) return ctor === 'True';
  if (isChar(ctor)) return ctor;
  return `"${ctor}"`;
};

const naiveJsOfDecisionTree = (dt: DecisionTree): string => {
  switch (dt.type) {
    case 'fail':
      return `throw new Error('pattern matching failed');`;
    case 'leaf':
      const returnStmt = `return ${naiveJsExprOf(dt.action)};`;

      if (Object.keys(dt.bindings).length > 0) {
        const bindings = Object.entries(dt.bindings)
          .map(([x, occ]) => `const ${x} = ${naiveJsExprOf(occ)};`)
          .join('\n');


        return `{\n ${bindings} \n ${returnStmt} \n}`;
      } else {
        return returnStmt;
      }
    case 'switch':
      const isNative = dt.tests.some(([ctor, _]) => isBool(ctor) || isNat(ctor) || isChar(ctor));

      return `
                switch (${occurenceOf(dt.occurence)}${isNative ? '' : '.name'}) {
                    ${dt.tests.map(([ctor, subtree]) =>
        `${ctor === '_' ? 'default' : `case ${nativeRepr(ctor)}`}:
                    ${naiveJsOfDecisionTree(subtree)}`
      ).join('\n')}
                }`;
  }
};