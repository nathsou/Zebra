import { Decl } from "../Parser/Decl.ts";
import { Expr } from "../Parser/Expr.ts";
import { emptyEnv, envAdd, envGet, envHas } from "../Utils/Env.ts";
import { bind, error, mapResult, ok, Result } from "../Utils/Result.ts";
import { ClosureVal, RecVarVal, showValEnv, ty, ValEnv, Value, valuesEq, ValueTypeMap } from "./Value.ts";

const freshVar = (prefix: string, env: ValEnv): string => {
    if (!envHas(env, prefix)) return prefix;

    let n = 0;
    while (envHas(env, `${prefix}${n}`)) { n++; };
    return `${prefix}${n}`;
};

type EvalError = string;
type EvalResult = Result<Value, EvalError>;

const checkType = <T extends keyof ValueTypeMap>(res: EvalResult, type: T): Result<ValueTypeMap[T], EvalError> => {
    return bind(res, val => {
        if (val.type !== type) {
            return error(`expected value of type "${type}", got "${val.type}"`);
        }

        return ok(val as ValueTypeMap[T]);
    });
};

const intBinopMap = {
    '+': (a: number, b: number) => a + b,
    '-': (a: number, b: number) => a - b,
    '*': (a: number, b: number) => a * b,
    '/': (a: number, b: number) => Math.floor(a / b),
    '%': (a: number, b: number) => a % b
};

const evalIntBinop = (
    a: Expr,
    b: Expr,
    env: ValEnv,
    op: (a: number, b: number) => number
): EvalResult => {
    return bind(checkType(evalExpr(a, env), 'int'), a => {
        return bind(checkType(evalExpr(b, env), 'int'), b => {
            return ok({ type: 'int', value: op(a.value, b.value) });
        });
    });
};

const intBoolBinopMap = {
    '<': (a: number, b: number) => a < b,
    '>': (a: number, b: number) => a > b,
    '<=': (a: number, b: number) => a <= b,
    '>=': (a: number, b: number) => a >= b
};

const evalIntBoolBinop = (
    a: Expr,
    b: Expr,
    env: ValEnv,
    op: (a: number, b: number) => boolean
): EvalResult => {
    return bind(checkType(evalExpr(a, env), 'int'), a => {
        return bind(checkType(evalExpr(b, env), 'int'), b => {
            return ok(ty(op(a.value, b.value) ? 'True' : 'False'));
        });
    });
};

const evalExpr = (expr: Expr, env: ValEnv): EvalResult => {
    switch (expr.type) {
        case 'variable':
            const id = expr.name;
            if (envHas(env, id)) {
                const val = envGet(env, id);
                if (val.type === 'recvar') {
                    const cl: ClosureVal = {
                        type: 'closure',
                        arg: val.arg,
                        body: val.body,
                        env: envAdd(val.env, val.name, val)
                    };
                    return ok(cl);
                }
                return ok(val);
            } else {
                return error(`unbound identifier: "${id}"`);
            }
        case 'tyconst':
            return bind(mapResult(expr.args.map(e => evalExpr(e, env)), x => x), args => {
                return ok({ type: 'tyconst', name: expr.name, args });
            });
        case 'if_then_else':
            const { cond, thenBranch, elseBranch } = expr;
            return bind(checkType(evalExpr(cond, env), 'tyconst'), cond => {
                if (cond.name === 'True') {
                    return evalExpr(thenBranch, env);
                } else {
                    return evalExpr(elseBranch, env);
                }
            });
        case 'binop':
            switch (expr.operator) {
                case '+':
                case '-':
                case '*':
                case '/':
                case '%':
                    return evalIntBinop(expr.left, expr.right, env, intBinopMap[expr.operator]);
                case '<':
                case '>':
                case '<=':
                case '>=':
                    return evalIntBoolBinop(expr.left, expr.right, env, intBoolBinopMap[expr.operator]);
                case '==':
                    return bind(evalExpr(expr.left, env), a => {
                        return bind(evalExpr(expr.right, env), b => {
                            return ok(ty(valuesEq(a, b) ? 'True' : 'False'));
                        });
                    });
                default:
                    return error(`unknown operator: "${expr.operator}"`);
            }
        case 'constant':
            switch (expr.kind) {
                case 'integer':
                    return ok({ type: 'int', value: expr.value });
            }
        case 'let_in':
            return bind(evalExpr(expr.middle, env), val => {
                const env2 = envAdd(env, expr.left, val);
                return evalExpr(expr.right, env2);
            });
        case 'let_rec_in':
            const recvar: RecVarVal = {
                type: 'recvar',
                name: expr.funName,
                arg: expr.arg,
                body: expr.middle,
                env
            };

            const env2 = envAdd(env, expr.funName, recvar);
            return evalExpr(expr.right, env2);
        case 'lambda':
            return ok({ type: 'closure', arg: expr.arg, body: expr.body, env });
        case 'app':
            return bind(checkType(evalExpr(expr.lhs, env), 'closure'), f => {
                return bind(evalExpr(expr.rhs, env), val => {
                    const v = freshVar(f.arg, f.env);
                    return evalExpr(f.body, envAdd(f.env, v, val));
                });
            });
    }
};

export const registerDecl = (decls: Decl[]): ValEnv => {
    let env: Record<string, Value> = {};

    for (const decl of decls) {
        switch (decl.type) {
            case 'fun':
                const recvar: RecVarVal = {
                    type: 'recvar',
                    name: decl.name,
                    arg: decl.curried.arg,
                    body: decl.curried.body,
                    env
                };

                env[decl.name] = recvar;
        }
    }

    return env;
};

export const interpret = (prog: Expr, env = emptyEnv<Value>()): EvalResult => evalExpr(prog, env);