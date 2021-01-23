import { assert } from "https://deno.land/std@0.83.0/testing/asserts.ts";
import { CoreExpr } from "../Core/CoreExpr.ts";
import { collectPatternSubst } from "../Interpreter/Pattern.ts";
import { TypeDecl } from "../Parser/Decl.ts";
import { Expr, showExpr } from "../Parser/Expr.ts";
import { decons, gen } from "../Utils/Common.ts";
import { emptyEnv, envAdd, envAddMut, envGet, envHas, envRem, envSum } from "../Utils/Env.ts";
import { isNone } from "../Utils/Maybe.ts";
import { bind, error, fold, isError, ok, reduceResult, Result } from "../Utils/Result.ts";
import { binopTy, boolTy, constantTy, funReturnTy, funTy, unitTy } from "./FixedTypes.ts";
import { freshInstance, freshTyVar, generalizeTy, isTyConst, MonoTy, PolyTy, polyTy, resetTyVars, showMonoTy, tyConst, TypeEnv } from "./Types.ts";
import { showSubst, substCompose, substituteEnv, substituteMono, TypeSubst, unify } from "./Unification.ts";

export type TypeError = string;
export type TypeCheckerResult = Result<MonoTy, TypeError>;

/**
 * infers the most general monomorphic type of an expression
 * @returns None if type checking failed
 */
export const inferExprType = (
    expr: CoreExpr,
    env: TypeEnv = {},
    instances: Map<string, string[]>
): TypeCheckerResult => {
    const tau = freshTyVar();
    return bind(collectExprTypeSubsts(env, expr, tau, instances), sig => {
        resetTyVars();

        if (sig[tau.value] === undefined) {
            return error(`unbound type variable: "${showMonoTy(tau)}" in ${showSubst(sig)}`);
        }

        return substituteMono(sig[tau.value], sig, instances);
    });
};

const checkedUnify = (
    s: MonoTy,
    t: MonoTy,
    expr: Expr,
    instances: Map<string, string[]>
): Result<TypeSubst, TypeError> => {
    const sig = unify(s, t, instances);

    if (isError(sig)) {
        if (sig.value === 'no_rule_applies' || sig.value === 'occur_check') {
            return error(`cannot unify ${showMonoTy(s)} with ${showMonoTy(t)} in expression "${showExpr(expr)}"`);
        } else {
            return sig;
        }
    }

    return sig;
};

const collectExprTypeSubsts = (
    env: TypeEnv,
    expr: CoreExpr,
    tau: MonoTy,
    instances: Map<string, string[]>
): Result<TypeSubst, TypeError> => {

    const collect = (env: TypeEnv, expr: CoreExpr, tau: MonoTy) =>
        collectExprTypeSubsts(env, expr, tau, instances);

    const substMono = (x: MonoTy, sig: TypeSubst) =>
        substituteMono(x, sig, instances);

    const unif = (s: MonoTy, t: MonoTy, expr: Expr) =>
        checkedUnify(s, t, expr, instances);

    const freshInst = (ty: PolyTy) => freshInstance(ty, instances);

    switch (expr.type) {
        case 'constant': {
            const tau_ = constantTy(expr);
            return bind(freshInst(tau_), freshTau => {
                return unif(tau, freshTau, expr);
            });
        }
        case 'variable': {
            if (!envHas(env, expr.name)) {
                throw new Error(`unbound variable "${expr.name}"`);
            }

            // console.log(expr.name, ':', showPolyTy(envGet(env, expr.name)));

            return bind(freshInst(envGet(env, expr.name)), ty => {
                return unif(tau, ty, expr);
            });
        }
        case 'binop': {
            const tau_ = binopTy(expr.operator);
            if (isNone(tau_)) {
                throw new Error(`unknown binary operator "${expr.operator}"`);
            }

            const tau1 = freshTyVar();
            const tau2 = freshTyVar();

            return bind(collect(env, expr.left, tau1), sig1 => {
                return bind(substituteEnv(env, sig1, instances), sig1env => {
                    return bind(collect(sig1env, expr.right, tau2), sig2 => {
                        const expTy = funTy(tau1, funTy(tau2, tau));
                        return bind(substCompose(instances, sig2, sig1), sig => {
                            return bind(substMono(expTy, sig), sigExpTy => {
                                return bind(freshInst(tau_), freshTau => {
                                    return bind(unif(sigExpTy, freshTau, expr), sig3 => {
                                        return substCompose(instances, sig3, sig);
                                    });
                                });
                            });
                        });
                    });
                });
            });
        }
        case 'if_then_else': {
            return bind(collect(env, expr.cond, boolTy), sig1 => {
                return bind(substituteEnv(env, sig1, instances), sig1Gamma => {
                    return bind(substMono(tau, sig1), sig1Tau => {
                        return bind(collect(sig1Gamma, expr.thenBranch, sig1Tau), sig2 => {
                            return bind(substituteEnv(sig1Gamma, sig2, instances), sig21Gamma => {
                                return bind(substMono(sig1Tau, sig2), sig21Tau => {
                                    return bind(collect(sig21Gamma, expr.elseBranch, sig21Tau), sig3 => {
                                        return substCompose(instances, sig3, sig2, sig1);
                                    });
                                });
                            })
                        });
                    });
                });
            });
        }
        case 'lambda': {
            const tau1 = freshTyVar();
            const tau2 = freshTyVar();
            const gammaX = envAdd(env, expr.arg, polyTy(tau1));
            return bind(collect(gammaX, expr.body, tau2), sig => {
                return bind(substMono(funTy(tau1, tau2), sig), sigExpTy => {
                    return bind(substMono(tau, sig), sigTau => {
                        return bind(unif(sigTau, sigExpTy, expr), sig2 => {
                            return substCompose(instances, sig2, sig);
                        });
                    });
                });
            });
        }
        case 'app': {
            const tau1 = freshTyVar();
            return bind(collect(env, expr.lhs, funTy(tau1, tau)), sig1 => {
                return bind(substituteEnv(env, sig1, instances), sig1Gamma => {
                    return bind(substMono(tau1, sig1), sig1Tau1 => {
                        return bind(collect(sig1Gamma, expr.rhs, sig1Tau1), sig2 => {
                            return substCompose(instances, sig2, sig1);
                        });
                    });
                });
            });
        }
        case 'let_in': {
            const tau1 = freshTyVar();
            return bind(collect(env, expr.middle, tau1), sig1 => {
                return bind(substituteEnv(env, sig1, instances), sig1Gamma => {
                    return bind(substMono(tau1, sig1), sig1Tau1 => {
                        return bind(substMono(tau, sig1), sig1Tau => {
                            const sig1Tau1Gen = generalizeTy(envRem(sig1Gamma, expr.left), sig1Tau1);
                            const gammaX = envAdd(sig1Gamma, expr.left, sig1Tau1Gen);
                            return bind(collect(gammaX, expr.right, sig1Tau), sig2 => {
                                return substCompose(instances, sig2, sig1);
                            });
                        });
                    });
                });
            });
        }
        case 'let_rec_in': {
            const tau1 = freshTyVar();
            const tau2 = freshTyVar();
            const fTy = funTy(tau1, tau2);
            const gammaX = envAdd(env, expr.arg, polyTy(tau1));
            const gammaF = envAdd(gammaX, expr.funName, polyTy(fTy));
            return bind(collect(gammaF, expr.middle, tau2), sig1 => {
                return bind(substituteEnv(env, sig1, instances), sig1Gamma => {
                    return bind(substMono(fTy, sig1), sig1FTy => {
                        return bind(substMono(tau, sig1), sig1Tau => {
                            const gammaF = envAdd(sig1Gamma, expr.funName, generalizeTy(sig1Gamma, sig1FTy));
                            return bind(collect(gammaF, expr.right, sig1Tau), sig2 => {
                                return substCompose(instances, sig2, sig1);
                            });
                        });
                    });
                });
            });
        }
        case 'tyconst': {
            if (envHas(env, expr.name)) {
                const constructorTy = envGet(env, expr.name);

                // the type of the variant is the last type
                // of the variant constructor
                const variantTy = freshInst(
                    polyTy(funReturnTy(constructorTy.ty),
                        ...constructorTy.polyVars)
                );

                return bind(variantTy, variantTy => {
                    return unif(tau, variantTy, expr);
                });
            } else if (expr.name === '()') { // unit
                return unif(tau, unitTy, expr);
            } else if (expr.name === 'tuple') { // tuples
                const n = expr.args.length;
                const tupleTy = tyConst('tuple', ...gen(n, freshTyVar));

                return bind(unif(tupleTy, tau, expr), sig0 => {
                    const res = fold(tupleTy.args, ([sig, gamma, i], tau_i) => {
                        return bind(collect(gamma, expr.args[i], tau_i), sig_i => {
                            return bind(substituteEnv(gamma, sig_i, instances), gamma_n => {
                                return bind(substCompose(instances, sig_i, sig), sig_n => {
                                    return ok([sig_n, gamma_n, i + 1] as const);
                                });
                            });
                        });
                    }, [sig0, env, 0 as number] as const);

                    return bind(res, ([sig]) => {
                        return ok(sig);
                    });
                });
            } else {
                return error(`unknown type constructor: "${expr.name}"`);
            }
        }
        case 'case_of': {
            const tau_e = freshTyVar();
            return bind(collect(env, expr.value, tau_e), sig_e0 => {
                const res = bind(substMono(tau, sig_e0), sig_e0_tau => {
                    return bind(substMono(tau_e, sig_e0), sig_e0_tau_e => {
                        return fold(expr.cases, ([sig_i, tau_i, tau_e_i], { pattern: p_n, expr: e_n }) => {
                            const vars: Record<string, PolyTy> = {};
                            return bind(collectPatternSubst(env, p_n, tau_e_i, vars, instances), sig_p => {
                                return bind(substCompose(instances, sig_p, sig_i), sig_p_i => {
                                    return bind(substMono(tau_e_i, sig_p), sig_p_tau_e_n => {
                                        return bind(substituteEnv(envSum(env, vars), sig_p_i, instances), gamma_vars => {
                                            return bind(substMono(tau_i, sig_p), sig_e_tau_i => {
                                                return bind(collect(gamma_vars, e_n, sig_e_tau_i), sig => {
                                                    return bind(substCompose(instances, sig, sig_p_i), sig_n => {
                                                        return bind(substMono(sig_e_tau_i, sig), tau_n => {
                                                            return bind(substMono(sig_p_tau_e_n, sig), tau_e_n => {
                                                                return ok([sig_n, tau_n, tau_e_n] as const);
                                                            });
                                                        });
                                                    });
                                                });
                                            });
                                        });
                                    });
                                });
                            });
                        }, [sig_e0, sig_e0_tau, sig_e0_tau_e] as const);
                    });
                });

                return bind(res, ([sig_n, _]) => {
                    return ok(sig_n);
                });
            });
        }
    }
};

export const registerTypeDecls = (decls: TypeDecl[]): [TypeEnv, Map<string, string[]>] => {
    let gamma = emptyEnv<PolyTy>();
    const instances = new Map<string, string[]>();

    for (const td of decls) {
        switch (td.type) {
            case 'datatype': {
                const ty = tyConst(td.name, ...td.typeVars);

                for (const variant of td.variants) {
                    const variantTy = variant.args.length === 0 ?
                        ty :
                        funTy(variant.args[0], ...variant.args.slice(1), ty);

                    assert(isTyConst(variantTy));

                    const realType = polyTy(tyConst(variantTy.name, ...variantTy.args), ...td.typeVars);
                    envAddMut(gamma, variant.name, realType);
                }
                break;
            }
            case 'typeclass': {
                for (const [f, ty] of td.methods) {
                    envAddMut(gamma, f, ty);
                }
                break;
            }
            case 'instance': {
                if (!instances.has(td.name)) {
                    instances.set(td.name, []);
                }

                instances.get(td.name)?.push(td.ty.name);
                break;
            }
        }
    }

    return [gamma, instances];
};
