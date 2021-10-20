import { CoreDecl, CoreFuncDecl } from "../Core/CoreDecl";
import { CoreExpr, CoreTyConstExpr, showCoreExpr } from "../Core/CoreExpr";
import { typeCheck } from "../Inferencer/TypeCheck";
import { MonoTy } from "../Inferencer/Types";
import { varOf } from "../Parser/Expr";
import { Program } from "../Parser/Program";
import { lambdaOf } from "../Parser/Sugar";
import { envAdd, envAddMut, envGet, envHas, envSum } from "../Utils/Env";
import { isSome } from "../Utils/Maybe";
import { bind, error, isOk, mapResult, ok, Result } from "../Utils/Result";
import { unifyPattern } from "./Pattern";
import { primitiveValEnv } from "./PrimitiveVals";
import { ClosureVal, RecVarVal, showValue, ValEnv, Value, ValueTypeMap } from "./Value";

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
                const env2 = envAdd(env, expr.left.name, val);
                return evalExpr(expr.right, env2);
            });
        case 'let_rec_in':
            const recvar: RecVarVal = {
                type: 'recvar',
                name: expr.funName.name,
                arg: expr.arg.name,
                body: expr.middle,
                env
            };

            const env2 = envAdd(env, expr.funName.name, recvar);
            return evalExpr(expr.right, env2);
        case 'lambda':
            return ok({ type: 'closure', arg: expr.arg.name, body: expr.body, env });
        case 'app':

            return bind(evalExpr(expr.lhs, env), f => {
                switch (f.type) {
                    case 'closure':
                        return bind(evalExpr(expr.rhs, env), val => {
                            return evalExpr(f.body, envAdd(f.env, f.arg, val));
                        });
                    case 'primitive_func':
                        return bind(evalExpr(expr.rhs, env), val => {
                            return ok(f.body(val));
                        });
                    default:
                        return error(`expected value of type 'closure' or 'primitive_func', got: ${f.type}`);
                }

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

                return error(`pattern matching is not exhaustive in "${showCoreExpr(expr)}", failed with: "${showValue(val)}"`);
            });
    }
};

export const registerDecl = (decls: CoreDecl[]): Result<ValEnv, EvalError> => {
    const env = primitiveValEnv();
    const constants: CoreFuncDecl[] = [];

    for (const decl of decls) {
        switch (decl.type) {
            case 'fun': {
                if (decl.args.length === 0) {
                    // constant declaration
                    constants.push(decl);
                } else {
                    const curried = lambdaOf(
                        decl.args.length > 0 ?
                            decl.args :
                            [varOf('_')],
                        decl.body
                    );

                    const recvar: RecVarVal = {
                        type: 'recvar',
                        name: decl.funName.name,
                        arg: curried.arg.name,
                        body: curried.body,
                        env
                    };

                    envAddMut(env, decl.funName.name, recvar);
                }
                break;
            }
            case 'datatype': {
                // introduce a variant constructor for each datatype variant
                for (const variant of decl.variants) {
                    // constant / nullary variants
                    if (variant.args.length === 0) {
                        envAddMut(env, variant.name, {
                            type: 'tyconst',
                            name: variant.name,
                            args: []
                        });
                    } else { // compound variants
                        const args = variant.args.map((_, i) => `x${i}`);
                        const body: CoreTyConstExpr = {
                            type: 'tyconst',
                            name: variant.name,
                            args: args.map(x => varOf(x))
                        };

                        envAddMut(env, variant.name, {
                            type: 'closure',
                            arg: args[0],
                            body: args.length > 1 ? lambdaOf(args.slice(1).map(varOf), body) : body,
                            env
                        });
                    }
                }
                break;
            }
        }
    }

    // evaluate constant declarations
    // "unbound variable" errors can occur
    // if constants[n] references constants[m] where n < m
    for (const { funName, body } of constants) {
        const res = evalExpr(body, env);

        if (isOk(res)) {
            envAddMut(env, funName.name, res.value);
        } else {
            return res;
        }
    }

    return ok(env);
};

export const interpret = (prog: Program): Result<[value: Value, type: MonoTy], string> => {
    return bind(typeCheck(prog), ({ ty, main, coreProg }) => {
        return bind(registerDecl(coreProg), env => {
            return bind(evalExpr(main.body, env), res => {
                return ok([res, ty]);
            });
        });
    });
};