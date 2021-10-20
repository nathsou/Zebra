"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.showPrim = exports.primitiveOf = exports.primitiveProgramOf = exports.primitiveProgramOfCore = void 0;
const Common_1 = require("../../Utils/Common");
const Maybe_1 = require("../../Utils/Maybe");
const DecisionTree_1 = require("../DecisionTrees/DecisionTree");
const DecisionTreeCompiler_1 = require("../DecisionTrees/DecisionTreeCompiler");
const primitiveProgramOfCore = (coreProg) => {
    const decls = [];
    for (const decl of coreProg) {
        const prim = primitiveDeclOfCoreDecl(decl);
        if (Maybe_1.isSome(prim)) {
            decls.push(...prim);
        }
    }
    return decls;
};
exports.primitiveProgramOfCore = primitiveProgramOfCore;
const primitiveProgramOf = (prog) => {
    return exports.primitiveProgramOfCore(prog.asCoreDecls());
};
exports.primitiveProgramOf = primitiveProgramOf;
const primitiveDeclOfCoreDecl = (d) => {
    switch (d.type) {
        case 'fun':
            return [{
                    type: 'fun',
                    name: d.funName.name,
                    args: d.args.map(a => a.name),
                    body: exports.primitiveOf(d.body)
                }];
        case 'datatype':
            const vs = d.variants.map(v => {
                const args = Common_1.gen(v.args.length, n => `v${n}`);
                const val = {
                    type: 'tyconst',
                    name: v.name,
                    args: args.map(x => ({ type: 'variable', name: x }))
                };
                return {
                    type: 'fun',
                    name: v.name,
                    args,
                    body: val
                };
            });
            return vs;
    }
};
const primitiveOf = (e) => {
    switch (e.type) {
        case 'app':
            return {
                type: 'app',
                lhs: exports.primitiveOf(e.lhs),
                rhs: exports.primitiveOf(e.rhs)
            };
        case 'case_of': {
            const m = DecisionTreeCompiler_1.clauseMatrixOf(e);
            const dt = DecisionTreeCompiler_1.compileClauseMatrix(e.arity, m, new Set());
            return {
                type: 'switch',
                value: exports.primitiveOf(e.value),
                dt
            };
        }
        case 'constant':
            return e;
        case 'if_then_else':
            return {
                type: 'if_then_else',
                cond: exports.primitiveOf(e.cond),
                thenBranch: exports.primitiveOf(e.thenBranch),
                elseBranch: exports.primitiveOf(e.elseBranch)
            };
        case 'lambda':
            return {
                type: 'lambda',
                arg: e.arg.name,
                body: exports.primitiveOf(e.body)
            };
        case 'let_in':
            return {
                type: 'let_in',
                left: e.left.name,
                middle: exports.primitiveOf(e.middle),
                right: exports.primitiveOf(e.right)
            };
        case 'let_rec_in':
            return {
                type: 'let_rec_in',
                arg: e.arg.name,
                funName: e.funName.name,
                middle: exports.primitiveOf(e.middle),
                right: exports.primitiveOf(e.right)
            };
        case 'tyconst':
            return {
                type: 'tyconst',
                name: e.name,
                args: e.args.map(exports.primitiveOf)
            };
        case 'variable':
            return e;
    }
};
exports.primitiveOf = primitiveOf;
const showPrim = (e) => {
    switch (e.type) {
        case 'app': return `(${exports.showPrim(e.lhs)} ${exports.showPrim(e.rhs)})`;
        case 'constant': return `${e.value}`;
        case 'if_then_else':
            return `if ${exports.showPrim(e.cond)} then ${exports.showPrim(e.thenBranch)} else ${exports.showPrim(e.elseBranch)}`;
        case 'lambda': return `λ${e.arg} -> ${exports.showPrim(e.body)}`;
        case 'let_in': return `let ${e.left} = ${exports.showPrim(e.middle)} in ${exports.showPrim(e.right)}`;
        case 'let_rec_in':
            return `let rec ${e.funName} ${e.arg} = ${exports.showPrim(e.middle)} in ${exports.showPrim(e.right)}`;
        case 'switch':
            return DecisionTree_1.showDecisionTree(e.dt, e.value);
        case 'tyconst':
            if (e.args.length === 0)
                return e.name;
            if (e.name === 'tuple')
                return `(${e.args.map(exports.showPrim).join(', ')})`;
            return `${e.name} ${e.args.map(exports.showPrim).join(' ')}`;
        case 'variable': return e.name;
        case 'subterm':
            return e.pos.length === 0 ? `arg[${e.index}]` : `arg[${e.index}]|${e.pos.join('.')}`;
    }
};
exports.showPrim = showPrim;
