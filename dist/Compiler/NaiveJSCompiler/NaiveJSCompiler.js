"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.naiveJsProgramOf = exports.rename = void 0;
const Context_1 = require("../../Inferencer/Context");
const Primitives_1 = require("../../Inferencer/Primitives");
const Sugar_1 = require("../../Parser/Sugar");
const Symbols_1 = require("../../Parser/Symbols");
const Common_1 = require("../../Utils/Common");
const PrimitiveCompiler_1 = require("../Primitive/PrimitiveCompiler");
const JSPrimitives_1 = require("./JSPrimitives");
const rename = (f) => {
    if (f === 'eval')
        return 'eval_';
    return f
        .split('')
        .map(c => Symbols_1.symbolRenameMap.has(c) ? (c === '_' ? '_' : `_${Symbols_1.symbolRenameMap.get(c)}_`) : c)
        .join('');
};
exports.rename = rename;
const usedPrimitives = new Set();
const naiveJsProgramOf = (prog) => {
    usedPrimitives.clear();
    const out = [];
    const prim = PrimitiveCompiler_1.primitiveProgramOfCore(prog);
    for (const decl of prim) {
        if (decl.type === 'fun' ||
            Context_1.context.datatypes.has(decl.name)) {
            out.push(naiveJsDeclOf(decl));
        }
    }
    const primitives = [...usedPrimitives]
        .map(f => Common_1.defined(JSPrimitives_1.jsPrimitives().get(f)).trim());
    return [primitives, out].map(l => l.join('\n\n')).join('\n\n');
};
exports.naiveJsProgramOf = naiveJsProgramOf;
const naiveJsDeclOf = (d) => {
    switch (d.type) {
        case 'fun':
            if (d.args.length === 0) {
                if (Context_1.context.datatypes.has(d.name)) {
                    return `const ${exports.rename(d.name)} = { name: "${d.name}", args: [] };`;
                }
                else {
                    return `const ${exports.rename(d.name)} = ${naiveJsExprOf(d.body)};`;
                }
            }
            const as = Common_1.tail(d.args);
            return `function ${exports.rename(d.name)}(${Common_1.head(d.args) ?? ''}) {
                return ${naiveJsExprOf(as.length > 0 ? Sugar_1.lambdaOf(as, d.body) : d.body)};
            }`;
    }
};
const naiveJsExprOf = (e) => {
    switch (e.type) {
        case 'variable':
            if (e.name === 'True')
                return 'true';
            if (e.name === 'False')
                return 'false';
            if (Primitives_1.isPrimitiveFunc(e.name)) {
                usedPrimitives.add(e.name);
                return e.name;
            }
            return exports.rename(e.name);
        case 'tyconst':
            return `({ name: "${e.name}", args: [${e.args.map(naiveJsExprOf).join(', ')}] })`;
        case 'lambda':
            return `(${e.arg} => ${naiveJsExprOf(e.body)})`;
        case 'let_in':
            return `(${e.left} => ${naiveJsExprOf(e.right)})(${naiveJsExprOf(e.middle)})`;
        case 'let_rec_in':
            const f = exports.rename(e.funName);
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
const occurenceOf = (occ) => {
    let v = occ.index === -1 ? `arg` : `arg.args[${occ.index}]`;
    for (const p of occ.pos) {
        v = `${v}.args[${p}]`;
    }
    return v;
};
const isNat = (n) => /[0-9]+/.test(n);
const isChar = (c) => c[0] === "'";
const isBool = (s) => s === 'True' || s === 'False';
const nativeRepr = (ctor) => {
    if (isNat(ctor))
        return ctor;
    if (isBool(ctor))
        return ctor === 'True';
    if (isChar(ctor))
        return ctor;
    return `"${ctor}"`;
};
const naiveJsOfDecisionTree = (dt) => {
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
            }
            else {
                return returnStmt;
            }
        case 'switch':
            const isNative = dt.tests.some(([ctor, _]) => isBool(ctor) || isNat(ctor) || isChar(ctor));
            return `
                switch (${occurenceOf(dt.occurence)}${isNative ? '' : '.name'}) {
                    ${dt.tests.map(([ctor, subtree]) => `${ctor === '_' ? 'default' : `case ${nativeRepr(ctor)}`}:
                    ${naiveJsOfDecisionTree(subtree)}`).join('\n')}
                }`;
    }
};
