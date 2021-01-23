import { assert } from "https://deno.land/std@0.83.0/testing/asserts.ts";
import { CoreExpr } from "../Core/CoreExpr.ts";
import { collectPatternSubst } from "../Interpreter/Pattern.ts";
import { TypeDecl } from "../Parser/Decl.ts";
import { Expr, showExpr } from "../Parser/Expr.ts";
import { defined, gen } from "../Utils/Common.ts";
import { emptyEnv, envAdd, envAddMut, envGet, envHas, envRem, envSum } from "../Utils/Env.ts";
import { isNone } from "../Utils/Maybe.ts";
import { bind, error, fold, isError, ok, Result } from "../Utils/Result.ts";
import { binopTy, boolTy, constantTy, funReturnTy, funTy, unitTy } from "./FixedTypes.ts";
import { clearTypeDeclContext, typeDeclContext } from "./TypeDeclContext.ts";
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
    env: TypeEnv = {}
): TypeCheckerResult => {
    const tau = freshTyVar();
    return bind(collectExprTypeSubsts(env, expr, tau), sig => {
        resetTyVars();

        if (sig[tau.value] === undefined) {
            return error(`unbound type variable: "${showMonoTy(tau)}" in ${showSubst(sig)}`);
        }

        return substituteMono(sig[tau.value], sig);
    });
};

const checkedUnify = (
    s: MonoTy,
    t: MonoTy,
    expr: Expr
): Result<TypeSubst, TypeError> => {
    const sig = unify(s, t);

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
    tau: MonoTy
): Result<TypeSubst, TypeError> => {
    switch (expr.type) {
        case 'constant': {
            const tau_ = constantTy(expr);
            return bind(freshInstance(tau_), freshTau => {
                return checkedUnify(tau, freshTau, expr);
            });
        }
        case 'variable': {
            const inEnv = envHas(env, expr.name);
            const isDataType = typeDeclContext.datatypes.has(expr.name);

            if (!inEnv && !isDataType) {
                throw new Error(`unbound variable "${expr.name}"`);
            }

            const varTy = inEnv ?
                envGet(env, expr.name) :
                defined(typeDeclContext.datatypes.get(expr.name));

            return bind(freshInstance(varTy), ty => {
                return checkedUnify(tau, ty, expr);
            });
        }
        case 'binop': {
            const tau_ = binopTy(expr.operator);
            if (isNone(tau_)) {
                throw new Error(`unknown binary operator "${expr.operator}"`);
            }

            const tau1 = freshTyVar();
            const tau2 = freshTyVar();

            return bind(collectExprTypeSubsts(env, expr.left, tau1), sig1 => {
                return bind(substituteEnv(env, sig1), sig1env => {
                    return bind(collectExprTypeSubsts(sig1env, expr.right, tau2), sig2 => {
                        const expTy = funTy(tau1, funTy(tau2, tau));
                        return bind(substCompose(sig2, sig1), sig => {
                            return bind(substituteMono(expTy, sig), sigExpTy => {
                                return bind(freshInstance(tau_), freshTau => {
                                    return bind(checkedUnify(sigExpTy, freshTau, expr), sig3 => {
                                        return substCompose(sig3, sig);
                                    });
                                });
                            });
                        });
                    });
                });
            });
        }
        case 'if_then_else': {
            return bind(collectExprTypeSubsts(env, expr.cond, boolTy), sig1 => {
                return bind(substituteEnv(env, sig1), sig1Gamma => {
                    return bind(substituteMono(tau, sig1), sig1Tau => {
                        return bind(collectExprTypeSubsts(sig1Gamma, expr.thenBranch, sig1Tau), sig2 => {
                            return bind(substituteEnv(sig1Gamma, sig2), sig21Gamma => {
                                return bind(substituteMono(sig1Tau, sig2), sig21Tau => {
                                    return bind(collectExprTypeSubsts(sig21Gamma, expr.elseBranch, sig21Tau), sig3 => {
                                        return substCompose(sig3, sig2, sig1);
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
            return bind(collectExprTypeSubsts(gammaX, expr.body, tau2), sig => {
                return bind(substituteMono(funTy(tau1, tau2), sig), sigExpTy => {
                    return bind(substituteMono(tau, sig), sigTau => {
                        return bind(checkedUnify(sigTau, sigExpTy, expr), sig2 => {
                            return substCompose(sig2, sig);
                        });
                    });
                });
            });
        }
        case 'app': {
            const tau1 = freshTyVar();
            return bind(collectExprTypeSubsts(env, expr.lhs, funTy(tau1, tau)), sig1 => {
                return bind(substituteEnv(env, sig1), sig1Gamma => {
                    return bind(substituteMono(tau1, sig1), sig1Tau1 => {
                        return bind(collectExprTypeSubsts(sig1Gamma, expr.rhs, sig1Tau1), sig2 => {
                            return substCompose(sig2, sig1);
                        });
                    });
                });
            });
        }
        case 'let_in': {
            const tau1 = freshTyVar();
            return bind(collectExprTypeSubsts(env, expr.middle, tau1), sig1 => {
                return bind(substituteEnv(env, sig1), sig1Gamma => {
                    return bind(substituteMono(tau1, sig1), sig1Tau1 => {
                        return bind(substituteMono(tau, sig1), sig1Tau => {
                            const sig1Tau1Gen = generalizeTy(envRem(sig1Gamma, expr.left), sig1Tau1);
                            const gammaX = envAdd(sig1Gamma, expr.left, sig1Tau1Gen);
                            return bind(collectExprTypeSubsts(gammaX, expr.right, sig1Tau), sig2 => {
                                return substCompose(sig2, sig1);
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
            return bind(collectExprTypeSubsts(gammaF, expr.middle, tau2), sig1 => {
                return bind(substituteEnv(env, sig1), sig1Gamma => {
                    return bind(substituteMono(fTy, sig1), sig1FTy => {
                        return bind(substituteMono(tau, sig1), sig1Tau => {
                            const gammaF = envAdd(sig1Gamma, expr.funName, generalizeTy(sig1Gamma, sig1FTy));
                            return bind(collectExprTypeSubsts(gammaF, expr.right, sig1Tau), sig2 => {
                                return substCompose(sig2, sig1);
                            });
                        });
                    });
                });
            });
        }
        case 'tyconst': {
            if (typeDeclContext.datatypes.has(expr.name)) {
                const constructorTy = defined(typeDeclContext.datatypes.get(expr.name));

                // the type of the variant is the last type
                // of the variant constructor
                const variantTy = freshInstance(
                    polyTy(funReturnTy(constructorTy.ty),
                        ...constructorTy.polyVars)
                );

                return bind(variantTy, variantTy => {
                    return checkedUnify(tau, variantTy, expr);
                });
            } else if (expr.name === '()') { // unit
                return checkedUnify(tau, unitTy, expr);
            } else if (expr.name === 'tuple') { // tuples
                const n = expr.args.length;
                const tupleTy = tyConst('tuple', ...gen(n, freshTyVar));

                return bind(checkedUnify(tupleTy, tau, expr), sig0 => {
                    const res = fold(tupleTy.args, ([sig, gamma, i], tau_i) => {
                        return bind(collectExprTypeSubsts(gamma, expr.args[i], tau_i), sig_i => {
                            return bind(substituteEnv(gamma, sig_i), gamma_n => {
                                return bind(substCompose(sig_i, sig), sig_n => {
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
            return bind(collectExprTypeSubsts(env, expr.value, tau_e), sig_e0 => {
                const res = bind(substituteMono(tau, sig_e0), sig_e0_tau => {
                    return bind(substituteMono(tau_e, sig_e0), sig_e0_tau_e => {
                        return fold(expr.cases, ([sig_i, tau_i, tau_e_i], { pattern: p_n, expr: e_n }) => {
                            const vars: Record<string, PolyTy> = {};
                            return bind(collectPatternSubst(env, p_n, tau_e_i, vars), sig_p => {
                                return bind(substCompose(sig_p, sig_i), sig_p_i => {
                                    return bind(substituteMono(tau_e_i, sig_p), sig_p_tau_e_n => {
                                        return bind(substituteEnv(envSum(env, vars), sig_p_i), gamma_vars => {
                                            return bind(substituteMono(tau_i, sig_p), sig_e_tau_i => {
                                                return bind(collectExprTypeSubsts(gamma_vars, e_n, sig_e_tau_i), sig => {
                                                    return bind(substCompose(sig, sig_p_i), sig_n => {
                                                        return bind(substituteMono(sig_e_tau_i, sig), tau_n => {
                                                            return bind(substituteMono(sig_p_tau_e_n, sig), tau_e_n => {
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

export const registerTypeDecls = (decls: TypeDecl[]): TypeEnv => {
    const gamma = emptyEnv<PolyTy>();

    // clear the global context
    clearTypeDeclContext();

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

                    // add this variant to the context
                    typeDeclContext.datatypes.set(variant.name, realType);
                }
                break;
            }
            case 'typeclass': {
                if (!typeDeclContext.typeclasses.has(td.name)) {
                    typeDeclContext.typeclasses.set(td.name, new Map());
                }

                for (const [f, ty] of td.methods) {
                    typeDeclContext.typeclasses.get(td.name)?.set(f, ty);
                    envAddMut(gamma, f, ty);
                }

                break;
            }
            case 'instance': {
                if (!typeDeclContext.instances.has(td.name)) {
                    typeDeclContext.instances.set(td.name, []);
                }

                // add this instance to the context
                typeDeclContext.instances.get(td.name)?.push(td.ty.name);
                break;
            }
        }
    }

    return gamma;
};
