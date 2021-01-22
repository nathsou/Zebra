import { CoreDecl, CoreFuncDecl } from "../Core/CoreDecl.ts";
import { CoreExpr, CoreTyConstExpr } from "../Core/CoreExpr.ts";
import { typeCheck } from "../Inferencer/TypeCheck.ts";
import { MonoTy } from "../Inferencer/Types.ts";
import { Decl } from "../Parser/Decl.ts";
import { showExpr } from "../Parser/Expr.ts";
import { lambdaOf } from "../Parser/Sugar.ts";
import { envAdd, envGet, envHas, envSum } from "../Utils/Env.ts";
import { isSome } from "../Utils/Maybe.ts";
import { bind, error, isOk, mapResult, ok, Result } from "../Utils/Result.ts";
import { unifyPattern } from "./Pattern.ts";
import { ClosureVal, RecVarVal, ty, ValEnv, Value, valuesEq, ValueTypeMap } from "./Value.ts";

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
    a: CoreExpr,
    b: CoreExpr,
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
    a: CoreExpr,
    b: CoreExpr,
    env: ValEnv,
    op: (a: number, b: number) => boolean
): EvalResult => {
    return bind(checkType(evalExpr(a, env), 'int'), a => {
        return bind(checkType(evalExpr(b, env), 'int'), b => {
            return ok(ty(op(a.value, b.value) ? 'True' : 'False'));
        });
    });
};

const evalExpr = (expr: CoreExpr, env: ValEnv): EvalResult => {
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
                case 'float':
                    return ok({ type: 'float', value: expr.value });
                case 'char':
                    return ok({ type: 'char', value: expr.value });
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
                    return evalExpr(f.body, envAdd(f.env, f.arg, val));
                });
            });
        case 'case_of':
            return bind(evalExpr(expr.value, env), val => {
                for (const { pattern, expr: e } of expr.cases) {
                    const sig = unifyPattern(pattern, val);
                    if (isSome(sig)) {
                        const env2 = envSum(env, sig);
                        return evalExpr(e, env2);
                    }
                }

                return error(`pattern matching is not exhaustive in "${showExpr(expr)}"`);
            });
    }
};

export const registerDecl = (decls: CoreDecl[]): Result<ValEnv, EvalError> => {
    let env: Record<string, Value> = {};
    const constants: CoreFuncDecl[] = [];

    for (const decl of decls) {
        switch (decl.type) {
            case 'fun': {
                if (decl.args.length === 0) {
                    // constant declaration
                    constants.push(decl);
                } else {
                    const curried = lambdaOf(decl.args.length > 0 ? decl.args : ['_'], decl.body);
                    const recvar: RecVarVal = {
                        type: 'recvar',
                        name: decl.name,
                        arg: curried.arg,
                        body: curried.body,
                        env
                    };

                    env[decl.name] = recvar;
                }
                break;
            }
            case 'datatype': {
                // introduce a variant constructor for each datatype variant
                for (const variant of decl.variants) {
                    // constant / nullary variants
                    if (variant.args.length === 0) {
                        env[variant.name] = {
                            type: 'tyconst',
                            name: variant.name,
                            args: []
                        };
                    } else { // compound variants
                        const args = variant.args.map((_, i) => `x${i}`);
                        const body: CoreTyConstExpr = {
                            type: 'tyconst',
                            name: variant.name,
                            args: args.map(x => ({ type: 'variable', name: x }))
                        };

                        env[variant.name] = {
                            type: 'closure',
                            arg: args[0],
                            body: args.length > 1 ? lambdaOf(args.slice(1), body) : body,
                            env
                        };
                    }
                }
                break;
            }
        }
    }

    // evaluate constant declarations
    // "unbound variable" errors can occur
    // if constants[n] references constants[m] where n < m
    for (const { name, body } of constants) {
        const res = evalExpr(body, env);

        if (isOk(res)) {
            env[name] = res.value;
        } else {
            return res;
        }
    }

    return ok(env);
};

export const interpret = (prog: Decl[]): Result<[value: Value, type: MonoTy], string> => {
    return bind(typeCheck(prog), ({ ty, main, coreProg }) => {
        return bind(registerDecl(coreProg), env => {
            return bind(evalExpr(main.body, env), res => {
                return ok([res, ty]);
            });
        });
    });
};