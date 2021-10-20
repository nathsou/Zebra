import { CoreExpr, showCoreExpr } from "../Core/CoreExpr";
import { collectPatternSubst } from "../Interpreter/Pattern";
import { DataTypeDecl, InstanceDecl, TypeClassDecl, TypeDecl } from "../Parser/Decl";
import { VarExpr } from "../Parser/Expr";
import { Program } from "../Parser/Program";
import { assert, defined, gen } from "../Utils/Common";
import { envAdd as envAddAux, envGet, envHas, envRem, envSum } from "../Utils/Env";
import { bind, error, fold, isError, isOk, ok, Result } from "../Utils/Result";
import { context, MethodName } from "./Context";
import { boolTy, constantTy, funReturnTy, funTy, unitTy } from "./FixedTypes";
import { canonicalizeTyVars, freshInstance, freshTyVar, generalizeTy, isTyConst, isTyVar, MonoTy, PolyTy, polyTy, showMonoTy, tyConst, TypeEnv, TyVar } from "./Types";
import { showSubst, substCompose, substituteEnv, substituteMono, TypeSubst, unify } from "./Unification";

export type TypeError = string;
export type TypeCheckerResult = Result<[MonoTy, TypeSubst], TypeError>;

/**
 * infers the most general monomorphic type of an expression
 * @returns an error if type checking failed
 */
export const inferExprType = (
    expr: CoreExpr,
    env: TypeEnv = {}
): TypeCheckerResult => {
    const tau = freshTyVar();
    return bind(collectExprTypeSubsts(env, expr, tau), (sig) => {
        if (sig[tau.value] === undefined) {
            return error(`unbound type variable: "${showMonoTy(tau)}" in ${showSubst(sig)}`);
        }

        return bind(substituteMono(sig[tau.value], sig), ty => {
            return ok([ty, sig]);
        });
    });
};

const checkedUnify = (
    s: MonoTy,
    t: MonoTy,
    expr: CoreExpr
): Result<TypeSubst, TypeError> => {
    const sig = unify(s, t);

    if (isError(sig)) {
        if (sig.value === 'no_rule_applies' || sig.value === 'occur_check') {
            const s_ = canonicalizeTyVars(s);
            const t_ = canonicalizeTyVars(t);
            return error(`cannot unify ${showMonoTy(s_)} with ${showMonoTy(t_)} in expression "${showCoreExpr(expr)}"`);
        } else {
            return sig;
        }
    }

    return sig;
};

// add identifiers to the context
const envAdd = (env: TypeEnv, { id, name }: VarExpr, ty: PolyTy): TypeEnv => {
    context.identifiers.set(id, [name, ty]);
    return envAddAux(env, name, ty);
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
            const isDataType = context.datatypes.has(expr.name);
            const isTyClassMethod = context.typeClassMethods.has(expr.name);

            if (!(inEnv || isDataType || isTyClassMethod)) {
                return error(`unbound variable "${expr.name}"`);
            }

            const varTy = inEnv ?
                envGet(env, expr.name) :
                isDataType ?
                    defined(context.datatypes.get(expr.name)) :
                    defined(context.typeClassMethods.get(expr.name));

            if (isTyClassMethod && !inEnv) {
                context.typeClassMethodsOccs.set(expr.id, [tau, expr.name]);
                context.typeClassMethodsOccs.set(expr.id, [tau, expr.name]);
            }

            return bind(freshInstance(varTy), ty => {
                if (!context.identifiers.has(expr.id)) {
                    context.identifiers.set(expr.id, [expr.name, polyTy(ty)]);
                }

                return checkedUnify(tau, ty, expr);
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
                            const sig1Tau1Gen = generalizeTy(envRem(sig1Gamma, expr.left.name), sig1Tau1);
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
            if (context.datatypes.has(expr.name)) {
                const constructorTy = defined(context.datatypes.get(expr.name));

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

                return bind(res, ([sig_n]) => {
                    return ok(sig_n);
                });
            });
        }
    }
};

const registerDataTypeDecls = (dataTypeDecls: Iterable<DataTypeDecl>): void => {
    for (const { name, typeVars, variants } of dataTypeDecls) {
        const ty = tyConst(name, ...typeVars);

        for (const variant of variants) {
            const variantTy = variant.args.length === 0 ?
                ty :
                funTy(variant.args[0], ...variant.args.slice(1), ty);

            assert(isTyConst(variantTy));

            const realType = polyTy(tyConst(variantTy.name, ...variantTy.args), ...typeVars);

            // add this variant to the context
            context.datatypes.set(variant.name, realType);
        }
    }
};

const registerTypeClassDecls = (typeClassDecls: Iterable<TypeClassDecl>): void => {
    for (const { name, tyVar, methods } of typeClassDecls) {
        if (!context.typeclasses.has(name)) {
            context.typeclasses.set(name, {
                methods: new Map(),
                tyVar: tyVar
            });
        }

        for (const [f, ty] of methods) {
            context.typeclasses.get(name)?.methods.set(f, ty);
            context.typeClassMethods.set(f, ty);
        }
    }
};

const registerInstanceDecls = (instances: Iterable<InstanceDecl>): void => {
    for (const { class_, ty } of instances) {
        if (!context.instances.has(class_)) {
            context.instances.set(class_, []);
        }

        const instTyName = isTyConst(ty) ? ty.name : '*';

        // add this instance to the context
        context.instances.get(class_)?.push(instTyName);
    }
};

export const registerTypeDecls = (prog: Program): void => {
    registerDataTypeDecls(prog.datatypes.values());
    registerTypeClassDecls(prog.typeclasses.values());
    registerInstanceDecls(prog.instances);
};

const replaceTyVar = (ty: MonoTy, tyVar: TyVar['value'], by: MonoTy): MonoTy => {
    if (isTyVar(ty)) {
        if (ty.value === tyVar) return by;
        return ty;
    }

    return tyConst(ty.name, ...ty.args.map(a => replaceTyVar(a, tyVar, by)));
};

export const instanceMethodsTypes = (inst: InstanceDecl): Result<Map<MethodName, MonoTy>, string> => {
    const methodsTys = new Map<MethodName, MonoTy>();

    for (const method of inst.defs.keys()) {
        if (!context.typeclasses.has(inst.class_)) {
            return error(`cannot define an instance for '${showMonoTy(inst.ty)}', type class '${inst.class_}' not found.`);
        }

        const class_ = defined(context.typeclasses.get(inst.class_));

        if (!class_.methods.has(method)) {
            return error(`'${method}' is not a valid method of type class '${inst.class_}'`);
        }

        const instMethodTy_ = defined(class_.methods.get(method));
        const instMethodTy = replaceTyVar(instMethodTy_.ty, class_.tyVar, inst.ty);

        methodsTys.set(method, instMethodTy);
    }

    return ok(methodsTys);
};

export const typeCheckInstances = (instances: InstanceDecl[]): Result<TypeSubst, string> => {
    let subst: TypeSubst = {};

    for (const inst of instances) {
        const tys = instanceMethodsTypes(inst);
        if (isError(tys)) return tys;

        for (const [method, ty] of tys.value.entries()) {
            if (!inst.defs.has(method)) {
                return error(`type class instance for '${inst.class_} ${showMonoTy(ty)}' is missing method '${method}'`);
            }
            const [tyVar] = defined(inst.defs.get(method));
            const [_, inferedTy] = defined(context.identifiers.get(tyVar));

            const sig = unify(ty, inferedTy.ty);

            if (isError(sig)) {
                return error(`invalid type for method '${method}' of type class '${inst.class_}'`);
            }

            const subst_ = substCompose(subst, sig.value);

            if (isOk(subst_)) {
                subst = subst_.value;
            } else {
                return subst_;
            }
        }
    }

    return ok(subst);
};