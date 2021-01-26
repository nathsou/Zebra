import { Expr, varOf } from "./Expr.ts";

export const renameVars = (e: Expr, renameMap: { [x: string]: string }): Expr => {
    switch (e.type) {
        case 'variable':
            if (renameMap[e.name] !== undefined) {
                return varOf(renameMap[e.name]);
            } else {
                return e;
            }
        case 'constant':
            return e;
        case 'binop': {
            return {
                type: 'binop',
                operator: e.operator,
                left: renameVars(e.left, renameMap),
                right: renameVars(e.right, renameMap)
            };
        }
        case 'tyconst': {
            return {
                type: 'tyconst',
                name: e.name,
                args: e.args.map(a => renameVars(a, renameMap))
            };
        }
        case 'if_then_else': {
            return {
                type: 'if_then_else',
                cond: renameVars(e.cond, renameMap),
                thenBranch: renameVars(e.thenBranch, renameMap),
                elseBranch: renameVars(e.elseBranch, renameMap)
            };
        }
        case 'app': {
            return {
                type: 'app',
                lhs: renameVars(e.lhs, renameMap),
                rhs: renameVars(e.rhs, renameMap)
            };
        }
        case 'lambda': {
            return {
                type: 'lambda',
                arg: e.arg,
                body: renameVars(e.body, renameMap)
            };
        }
        case 'let_in': {
            return {
                type: 'let_in',
                left: e.left,
                middle: renameVars(e.middle, renameMap),
                right: renameVars(e.right, renameMap),
            };
        }
        case 'let_rec_in': {
            return {
                type: 'let_rec_in',
                funName: e.funName,
                arg: e.arg,
                middle: renameVars(e.middle, renameMap),
                right: renameVars(e.right, renameMap)
            }
        }
        case 'case_of': {
            return {
                type: 'case_of',
                arity: e.arity,
                cases: e.cases.map(({ pattern, expr }) => ({
                    pattern,
                    expr: renameVars(expr, renameMap)
                })),
                value: renameVars(e.value, renameMap)
            };
        }
    }
};