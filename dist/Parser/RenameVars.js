"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renameVars = void 0;
const Expr_1 = require("./Expr");
const renameVars = (e, renameMap) => {
    switch (e.type) {
        case 'variable':
            if (renameMap[e.name] !== undefined) {
                return Expr_1.varOf(renameMap[e.name]);
            }
            else {
                return e;
            }
        case 'constant':
            return e;
        case 'tyconst': {
            return {
                type: 'tyconst',
                name: e.name,
                args: e.args.map(a => exports.renameVars(a, renameMap))
            };
        }
        case 'if_then_else': {
            return {
                type: 'if_then_else',
                cond: exports.renameVars(e.cond, renameMap),
                thenBranch: exports.renameVars(e.thenBranch, renameMap),
                elseBranch: exports.renameVars(e.elseBranch, renameMap)
            };
        }
        case 'app': {
            return {
                type: 'app',
                lhs: exports.renameVars(e.lhs, renameMap),
                rhs: exports.renameVars(e.rhs, renameMap)
            };
        }
        case 'lambda': {
            return {
                type: 'lambda',
                arg: e.arg,
                body: exports.renameVars(e.body, renameMap)
            };
        }
        case 'let_in': {
            return {
                type: 'let_in',
                left: e.left,
                middle: exports.renameVars(e.middle, renameMap),
                right: exports.renameVars(e.right, renameMap),
            };
        }
        case 'let_rec_in': {
            return {
                type: 'let_rec_in',
                funName: e.funName,
                arg: e.arg,
                middle: exports.renameVars(e.middle, renameMap),
                right: exports.renameVars(e.right, renameMap)
            };
        }
        case 'case_of': {
            return {
                type: 'case_of',
                arity: e.arity,
                cases: e.cases.map(({ pattern, expr }) => ({
                    pattern,
                    expr: exports.renameVars(expr, renameMap)
                })),
                value: exports.renameVars(e.value, renameMap)
            };
        }
    }
};
exports.renameVars = renameVars;
