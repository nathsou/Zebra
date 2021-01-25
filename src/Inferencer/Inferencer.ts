import { assert } from "https://deno.land/std@0.83.0/testing/asserts.ts";
import { CoreExpr } from "../Core/CoreExpr.ts";
import { renameTyClassInstance } from "../Core/ExprOfFunDecls.ts";
import { collectPatternSubst } from "../Interpreter/Pattern.ts";
import { InstanceDecl, TypeDecl } from "../Parser/Decl.ts";
import { Expr, showExpr } from "../Parser/Expr.ts";
import { defined, gen } from "../Utils/Common.ts";
import { emptyEnv, envAdd, envAddMut, envGet, envHas, envRem, envSum } from "../Utils/Env.ts";
import { isNone } from "../Utils/Maybe.ts";
import { bind, error, fold, isError, ok, Result, Unit } from "../Utils/Result.ts";
import { binopTy, boolTy, constantTy, funReturnTy, funTy, unitTy } from "./FixedTypes.ts";
import { clearTypeDeclContext, typeDeclContext } from "./TypeDeclContext.ts";
import { canonicalizeTyVars, freshInstance, freshTyVar, generalizeTy, isTyConst, isTyVar, MonoTy, PolyTy, polyTy, resetTyVars, showMonoTy, showOverloadedTy, tyConst, TypeEnv, TyVar } from "./Types.ts";
import { showSubst, substCompose, substituteEnv, substituteMono, TypeSubst, unify } from "./Unification.ts";

export type TypeError = string;
export type TypeCheckerResult = Result<[MonoTy, TypeEnv], TypeError>;

/**
 * infers the most general monomorphic type of an expression
 * @returns None if type checking failed
 */
export const inferExprType = (
    expr: CoreExpr,
    env: TypeEnv = {}
): TypeCheckerResult => {
    const tau = freshTyVar();
    return bind(collectExprTypeSubsts(env, expr, tau), ([sig, gamma]) => {
        resetTyVars();

        if (sig[tau.value] === undefined) {
            return error(`unbound type variable: "${showMonoTy(tau)}" in ${showSubst(sig)}`);
        }

        return bindEnv(substituteMono(sig[tau.value], sig), gamma);
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
            const s_ = canonicalizeTyVars(s);
            const t_ = canonicalizeTyVars(t);
            return error(`cannot unify ${showMonoTy(s_)} with ${showMonoTy(t_)} in expression "${showExpr(expr)}"`);
        } else {
            return sig;
        }
    }

    return sig;
};

const bindEnv = <T, E>(res: Result<T, E>, env: TypeEnv): Result<[T, TypeEnv], E> => {
    return bind(res, t => ok([t, env]));
};

// TODO : Return the env as well
const collectExprTypeSubsts = (
    env: TypeEnv,
    expr: CoreExpr,
    tau: MonoTy
): Result<[TypeSubst, TypeEnv], TypeError> => {
    switch (expr.type) {
        case 'constant': {
            const tau_ = constantTy(expr);
            return bind(freshInstance(tau_), freshTau => {
                return bindEnv(checkedUnify(tau, freshTau, expr), env);
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
                return bindEnv(checkedUnify(tau, ty, expr), env);
            });
        }
        case 'binop': {
            const tau_ = binopTy(expr.operator);
            if (isNone(tau_)) {
                throw new Error(`unknown binary operator "${expr.operator}"`);
            }

            const tau1 = freshTyVar();
            const tau2 = freshTyVar();

            return bind(collectExprTypeSubsts(env, expr.left, tau1), ([sig1]) => {
                return bind(substituteEnv(env, sig1), sig1env => {
                    return bind(collectExprTypeSubsts(sig1env, expr.right, tau2), ([sig2]) => {
                        const expTy = funTy(tau1, funTy(tau2, tau));
                        return bind(substCompose(sig2, sig1), sig => {
                            return bind(substituteMono(expTy, sig), sigExpTy => {
                                return bind(freshInstance(tau_), freshTau => {
                                    return bind(checkedUnify(sigExpTy, freshTau, expr), sig3 => {
                                        return bindEnv(substCompose(sig3, sig), sig1env);
                                    });
                                });
                            });
                        });
                    });
                });
            });
        }
        case 'if_then_else': {
            return bind(collectExprTypeSubsts(env, expr.cond, boolTy), ([sig1]) => {
                return bind(substituteEnv(env, sig1), sig1Gamma => {
                    return bind(substituteMono(tau, sig1), sig1Tau => {
                        return bind(collectExprTypeSubsts(sig1Gamma, expr.thenBranch, sig1Tau), ([sig2]) => {
                            return bind(substituteEnv(sig1Gamma, sig2), sig21Gamma => {
                                return bind(substituteMono(sig1Tau, sig2), sig21Tau => {
                                    return bind(collectExprTypeSubsts(sig21Gamma, expr.elseBranch, sig21Tau), ([sig3]) => {
                                        return bindEnv(substCompose(sig3, sig2, sig1), sig21Gamma);
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
            return bind(collectExprTypeSubsts(gammaX, expr.body, tau2), ([sig]) => {
                return bind(substituteMono(funTy(tau1, tau2), sig), sigExpTy => {
                    return bind(substituteMono(tau, sig), sigTau => {
                        return bind(checkedUnify(sigTau, sigExpTy, expr), sig2 => {
                            return bindEnv(substCompose(sig2, sig), gammaX);
                        });
                    });
                });
            });
        }
        case 'app': {
            const tau1 = freshTyVar();
            return bind(collectExprTypeSubsts(env, expr.lhs, funTy(tau1, tau)), ([sig1]) => {
                return bind(substituteEnv(env, sig1), sig1Gamma => {
                    return bind(substituteMono(tau1, sig1), sig1Tau1 => {
                        return bind(collectExprTypeSubsts(sig1Gamma, expr.rhs, sig1Tau1), ([sig2]) => {
                            return bindEnv(substCompose(sig2, sig1), sig1Gamma);
                        });
                    });
                });
            });
        }
        case 'let_in': {
            const tau1 = freshTyVar();
            return bind(collectExprTypeSubsts(env, expr.middle, tau1), ([sig1]) => {
                return bind(substituteEnv(env, sig1), sig1Gamma => {
                    return bind(substituteMono(tau1, sig1), sig1Tau1 => {
                        return bind(substituteMono(tau, sig1), sig1Tau => {
                            const sig1Tau1Gen = generalizeTy(envRem(sig1Gamma, expr.left), sig1Tau1);
                            const gammaX = envAdd(sig1Gamma, expr.left, sig1Tau1Gen);
                            return bind(collectExprTypeSubsts(gammaX, expr.right, sig1Tau), ([sig2, gamma]) => {
                                return bindEnv(substCompose(sig2, sig1), gamma);
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
            return bind(collectExprTypeSubsts(gammaF, expr.middle, tau2), ([sig1]) => {
                return bind(substituteEnv(env, sig1), sig1Gamma => {
                    return bind(substituteMono(fTy, sig1), sig1FTy => {
                        return bind(substituteMono(tau, sig1), sig1Tau => {
                            const gammaF = envAdd(sig1Gamma, expr.funName, generalizeTy(sig1Gamma, sig1FTy));
                            return bind(collectExprTypeSubsts(gammaF, expr.right, sig1Tau), ([sig2, gamma]) => {
                                return bindEnv(substCompose(sig2, sig1), gamma);
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
                    return bindEnv(checkedUnify(tau, variantTy, expr), env);
                });
            } else if (expr.name === '()') { // unit
                return bindEnv(checkedUnify(tau, unitTy, expr), env);
            } else if (expr.name === 'tuple') { // tuples
                const n = expr.args.length;
                const tupleTy = tyConst('tuple', ...gen(n, freshTyVar));

                return bind(checkedUnify(tupleTy, tau, expr), sig0 => {
                    const res = fold(tupleTy.args, ([sig, gamma, i], tau_i) => {
                        return bind(collectExprTypeSubsts(gamma, expr.args[i], tau_i), ([sig_i]) => {
                            return bind(substituteEnv(gamma, sig_i), gamma_n => {
                                return bind(substCompose(sig_i, sig), sig_n => {
                                    return ok([sig_n, gamma_n, i + 1] as const);
                                });
                            });
                        });
                    }, [sig0, env, 0 as number] as const);

                    return bind(res, ([sig, gamma]) => {
                        return ok([sig, gamma]);
                    });
                });
            } else {
                return error(`unknown type constructor: "${expr.name}"`);
            }
        }
        case 'case_of': {
            const tau_e = freshTyVar();
            return bind(collectExprTypeSubsts(env, expr.value, tau_e), ([sig_e0]) => {
                const res = bind(substituteMono(tau, sig_e0), sig_e0_tau => {
                    return bind(substituteMono(tau_e, sig_e0), sig_e0_tau_e => {
                        return fold(expr.cases, ([sig_i, tau_i, tau_e_i], { pattern: p_n, expr: e_n }) => {
                            const vars: Record<string, PolyTy> = {};
                            return bind(collectPatternSubst(env, p_n, tau_e_i, vars), sig_p => {
                                return bind(substCompose(sig_p, sig_i), sig_p_i => {
                                    return bind(substituteMono(tau_e_i, sig_p), sig_p_tau_e_n => {
                                        return bind(substituteEnv(envSum(env, vars), sig_p_i), gamma_vars => {
                                            return bind(substituteMono(tau_i, sig_p), sig_e_tau_i => {
                                                return bind(collectExprTypeSubsts(gamma_vars, e_n, sig_e_tau_i), ([sig]) => {
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

                return bind(res, ([sig_n]) => {
                    return ok([sig_n, env]);
                });
            });
        }
    }
};

export const registerTypeDecls = (decls: TypeDecl[]): TypeEnv => {
    const gamma = emptyEnv<PolyTy>();
    const ctx = typeDeclContext;

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
                    ctx.datatypes.set(variant.name, realType);
                }
                break;
            }
            case 'typeclass': {
                if (!ctx.typeclasses.has(td.name)) {
                    ctx.typeclasses.set(td.name, { methods: new Map(), tyVar: td.tyVar });
                }

                for (const [f, ty] of td.methods) {
                    ctx.typeclasses.get(td.name)?.methods.set(f, ty);
                    envAddMut(gamma, f, ty);
                }

                break;
            }
            case 'instance': {
                if (!ctx.instances.has(td.class_)) {
                    ctx.instances.set(td.class_, []);
                }

                // add this instance to the context
                ctx.instances.get(td.class_)?.push(td.ty.name);
                break;
            }
        }
    }

    return gamma;
};

export const typeCheckInstances = (instances: InstanceDecl[], env: TypeEnv): Result<Unit, string> => {
    const ctx = typeDeclContext;

    for (const inst of instances) {
        for (const [method, decl] of inst.defs) {
            const f = renameTyClassInstance(method, inst.ty, inst.class_);

            if (!ctx.typeclasses.has(inst.class_)) {
                return error(`cannot define an instance for '${showMonoTy(inst.ty)}', type class '${inst.class_}' not found.`);
            }

            const class_ = defined(ctx.typeclasses.get(inst.class_));

            if (!class_.methods.has(method)) {
                return error(`'${method}' is not a valid method of type class '${inst.class_}'`);
            }

            const replaceTyVar = (ty: MonoTy, tyVar: TyVar['value'], by: MonoTy): MonoTy => {
                if (isTyVar(ty)) {
                    if (ty.value === tyVar) return by;
                    return ty;
                }

                return tyConst(ty.name, ...ty.args.map(a => replaceTyVar(a, tyVar, by)));
            };

            const expectedTy_ = defined(class_.methods.get(method));
            const expectedTy = replaceTyVar(expectedTy_.ty, class_.tyVar, inst.ty);

            const inferedTy = envGet(env, f);

            const res = checkedUnify(expectedTy, inferedTy.ty, decl.body);

            if (isError(res)) {
                return error(`invalid type for method '${method}' of type class '${inst.class_}'\n${res.value}'`);
            }
        }
    }

    return ok('()');
};