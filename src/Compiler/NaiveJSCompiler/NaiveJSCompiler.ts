import { CoreDecl } from "../../Core/CoreDecl.ts";
import { lambdaOf } from "../../Parser/Sugar.ts";
import { head, tail } from "../../Utils/Common.ts";
import { DecisionTree } from "../DecisionTrees/DecisionTree.ts";
import { IndexedOccurence } from "../DecisionTrees/DecisionTreeCompiler.ts";
import { primitiveProgramOfCore } from "../Primitive/PrimitiveCompiler.ts";
import { PrimDecl } from "../Primitive/PrimitiveDecl.ts";
import { PrimExpr } from "../Primitive/PrimitiveExpr.ts";

export const rename = (f: string): string => {
    if (f === 'eval') return 'eval_';
    return f.replace(/'/g, '_prime_');
};

const equ = `
function __equ(a, b) {
    if (typeof a !== 'object') {
        return a === b;
    }

    if (a.name !== b.name || a.args.length !== b.args.length) {
        return false;
    }

    for (let i = 0; i < a.args.length; i++) {
        if (!__equ(a.args[i], b.args[i])) {
            return false;
        }
    }

    return true;
}
`;

let usedEqu = false;

export const naiveJsProgramOf = (prog: CoreDecl[]): string => {
    const out: string[] = [];

    const prim = primitiveProgramOfCore(prog);

    for (const decl of prim) {
        out.push(naiveJsDeclOf(decl));
    }

    const ret = (usedEqu ? `${equ}\n\n` : '') + out.join('\n\n');

    usedEqu = false;

    return ret;
};

const naiveJsDeclOf = (d: PrimDecl): string => {
    switch (d.type) {
        case 'fun':
            if (d.args.length === 0) {
                if (d.name[0] === d.name[0].toUpperCase()) {
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
            return rename(e.name);
        case 'tyconst':
            return `({ name: "${e.name}", args: [${e.args.map(naiveJsExprOf).join(', ')}] })`;
        case 'binop':
            const lhs = naiveJsExprOf(e.left);
            const rhs = naiveJsExprOf(e.right);
            // use deep comparison
            if (e.operator === '==') {
                usedEqu = true;
                return `__equ(${lhs}, ${rhs})`;
            }

            return `${lhs} ${e.operator} ${rhs}`;
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