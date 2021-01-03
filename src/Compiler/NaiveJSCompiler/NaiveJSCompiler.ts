import { CoreDecl } from "../../Core/CoreDecl.ts";
import { lambdaOf } from "../../Parser/Sugar.ts";
import { head, tail } from "../../Utils/Common.ts";
import { DecisionTree } from "../DecisionTrees/DecisionTree.ts";
import { IndexedOccurence } from "../DecisionTrees/DecisionTreeCompiler.ts";
import { primitiveProgramOf } from "../Primitive/PrimitiveCompiler.ts";
import { PrimDecl } from "../Primitive/PrimitiveDecl.ts";
import { PrimExpr } from "../Primitive/PrimitiveExpr.ts";

export const rename = (f: string): string => {
    return f.replace(/'/g, '_prime_');
};

export const naiveJsProgramOf = (prog: CoreDecl[]): string => {
    let out: string[] = [];

    for (const decl of primitiveProgramOf(prog)) {
        out.push(naiveJsDeclOf(decl));
    }

    return out.join('\n\n');
};

const naiveJsDeclOf = (d: PrimDecl): string => {
    switch (d.type) {
        case 'fun':
            if (d.args.length === 0 && d.name !== 'main') {
                return `const ${rename(d.name)} = { name: "${d.name}", args: [] };`
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
            return rename(e.name);
        case 'tyconst':
            return `({ name: "${e.name}", args: [${e.args.map(naiveJsExprOf).join(', ')}] })`;
        case 'binop':
            const op = e.operator === '==' ? '===' : e.operator;
            return `${naiveJsExprOf(e.left)} ${op} ${naiveJsExprOf(e.right)}`;
        case 'lambda':
            return `${e.arg} => ${naiveJsExprOf(e.body)}`;
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

const nativeRepr = (ctor: string) => {
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
            return `return ${naiveJsExprOf(dt.action)};`;
        case 'switch':
            const isNative = dt.tests.some(([ctor, _]) => isBool(ctor) || isNat(ctor) ||isChar(ctor));

            return `
                switch (${occurenceOf(dt.occurence)}${isNative ? '' : '.name'}) {
                    ${dt.tests.map(([ctor, subtree]) =>
                `${ctor === '_' ? 'default' : `case ${nativeRepr(ctor)}`}:
                    ${naiveJsOfDecisionTree(subtree)}`
            ).join('\n')}
                }`;
    }
};