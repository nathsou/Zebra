"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.exprOfCore = exports.showCoreExpr = void 0;
const Pattern_1 = require("../Interpreter/Pattern");
const showCoreExpr = (e, showVarIds = false) => {
    switch (e.type) {
        case 'variable':
            return showVarIds ? `${e.name}@${e.id}` : e.name;
        case 'constant':
            switch (e.kind) {
                case 'integer':
                    return `${e.value}`;
                case 'float':
                    return `${e.value}`;
                case 'char':
                    return `'${e.value}'`;
            }
        case 'let_in': {
            const name = showVarIds ? `${e.left.name}@${e.left.id}` : e.left.name;
            return `let ${name} = ${exports.showCoreExpr(e.middle, showVarIds)} in ${exports.showCoreExpr(e.right, showVarIds)}`;
        }
        case 'let_rec_in': {
            const name = showVarIds ? `${e.funName.name}@${e.funName.id}` : e.funName.name;
            return `let rec ${name} ${e.arg.name} = ${exports.showCoreExpr(e.middle, showVarIds)} in ${exports.showCoreExpr(e.right, showVarIds)}`;
        }
        case 'lambda': {
            const name = showVarIds ? `${e.arg.name}@${e.arg.id}` : e.arg.name;
            return `λ${name} -> ${exports.showCoreExpr(e.body, showVarIds)}`;
        }
        case 'if_then_else':
            return `if ${exports.showCoreExpr(e.cond, showVarIds)} then ${exports.showCoreExpr(e.thenBranch, showVarIds)} else ${exports.showCoreExpr(e.elseBranch, showVarIds)}`;
        case 'app':
            return `((${exports.showCoreExpr(e.lhs, showVarIds)}) ${exports.showCoreExpr(e.rhs, showVarIds)})`;
        case 'tyconst':
            if (e.args.length === 0) {
                return e.name;
            }
            if (e.name === 'tuple') {
                return `(${e.args.map(a => exports.showCoreExpr(a, showVarIds)).join(', ')})`;
            }
            return `(${e.name} ${e.args.map(a => exports.showCoreExpr(a, showVarIds)).join(' ')})`;
        case 'case_of':
            const cases = e.cases.map(({ pattern, expr }) => `${Pattern_1.showPattern(pattern)} -> ${exports.showCoreExpr(expr, showVarIds)}`);
            return `case ${exports.showCoreExpr(e.value, showVarIds)} of ${cases.join('  | ')}`;
    }
};
exports.showCoreExpr = showCoreExpr;
const exprOfCore = (e) => {
    switch (e.type) {
        case 'constant':
            return e;
        case 'app':
            return {
                type: 'app',
                lhs: exports.exprOfCore(e.lhs),
                rhs: exports.exprOfCore(e.rhs)
            };
        case 'case_of':
            return {
                type: 'case_of',
                arity: e.arity,
                value: exports.exprOfCore(e.value),
                cases: e.cases.map(({ expr, pattern }) => ({
                    expr: exports.exprOfCore(expr),
                    pattern
                }))
            };
        case 'if_then_else':
            return {
                type: 'if_then_else',
                cond: exports.exprOfCore(e.cond),
                thenBranch: exports.exprOfCore(e.thenBranch),
                elseBranch: exports.exprOfCore(e.elseBranch)
            };
        case 'lambda':
            return {
                type: 'lambda',
                arg: Pattern_1.patVarOfVar(e.arg),
                body: exports.exprOfCore(e.body)
            };
        case 'let_in':
            return {
                type: 'let_in',
                left: Pattern_1.patVarOfVar(e.left),
                middle: exports.exprOfCore(e.middle),
                right: exports.exprOfCore(e.right)
            };
        case 'let_rec_in':
            return {
                type: 'let_rec_in',
                arg: Pattern_1.patVarOfVar(e.arg),
                funName: e.funName,
                middle: exports.exprOfCore(e.middle),
                right: exports.exprOfCore(e.right)
            };
        case 'tyconst':
            return {
                type: 'tyconst',
                name: e.name,
                args: e.args.map(exports.exprOfCore)
            };
        case 'variable':
            return e;
    }
};
exports.exprOfCore = exprOfCore;
