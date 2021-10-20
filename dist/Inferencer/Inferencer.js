"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.typeCheckInstances = exports.instanceMethodsTypes = exports.registerTypeDecls = exports.inferExprType = void 0;
const CoreExpr_1 = require("../Core/CoreExpr");
const Pattern_1 = require("../Interpreter/Pattern");
const Common_1 = require("../Utils/Common");
const Env_1 = require("../Utils/Env");
const Result_1 = require("../Utils/Result");
const Context_1 = require("./Context");
const FixedTypes_1 = require("./FixedTypes");
const Types_1 = require("./Types");
const Unification_1 = require("./Unification");
/**
 * infers the most general monomorphic type of an expression
 * @returns an error if type checking failed
 */
const inferExprType = (expr, env = {}) => {
    const tau = Types_1.freshTyVar();
    return Result_1.bind(collectExprTypeSubsts(env, expr, tau), (sig) => {
        if (sig[tau.value] === undefined) {
            return Result_1.error(`unbound type variable: "${Types_1.showMonoTy(tau)}" in ${Unification_1.showSubst(sig)}`);
        }
        return Result_1.bind(Unification_1.substituteMono(sig[tau.value], sig), ty => {
            return Result_1.ok([ty, sig]);
        });
    });
};
exports.inferExprType = inferExprType;
const checkedUnify = (s, t, expr) => {
    const sig = Unification_1.unify(s, t);
    if (Result_1.isError(sig)) {
        if (sig.value === 'no_rule_applies' || sig.value === 'occur_check') {
            const s_ = Types_1.canonicalizeTyVars(s);
            const t_ = Types_1.canonicalizeTyVars(t);
            return Result_1.error(`cannot unify ${Types_1.showMonoTy(s_)} with ${Types_1.showMonoTy(t_)} in expression "${CoreExpr_1.showCoreExpr(expr)}"`);
        }
        else {
            return sig;
        }
    }
    return sig;
};
// add identifiers to the context
const envAdd = (env, { id, name }, ty) => {
    Context_1.context.identifiers.set(id, [name, ty]);
    return Env_1.envAdd(env, name, ty);
};
const collectExprTypeSubsts = (env, expr, tau) => {
    switch (expr.type) {
        case 'constant': {
            const tau_ = FixedTypes_1.constantTy(expr);
            return Result_1.bind(Types_1.freshInstance(tau_), freshTau => {
                return checkedUnify(tau, freshTau, expr);
            });
        }
        case 'variable': {
            const inEnv = Env_1.envHas(env, expr.name);
            const isDataType = Context_1.context.datatypes.has(expr.name);
            const isTyClassMethod = Context_1.context.typeClassMethods.has(expr.name);
            if (!(inEnv || isDataType || isTyClassMethod)) {
                return Result_1.error(`unbound variable "${expr.name}"`);
            }
            const varTy = inEnv ?
                Env_1.envGet(env, expr.name) :
                isDataType ?
                    Common_1.defined(Context_1.context.datatypes.get(expr.name)) :
                    Common_1.defined(Context_1.context.typeClassMethods.get(expr.name));
            if (isTyClassMethod && !inEnv) {
                Context_1.context.typeClassMethodsOccs.set(expr.id, [tau, expr.name]);
                Context_1.context.typeClassMethodsOccs.set(expr.id, [tau, expr.name]);
            }
            return Result_1.bind(Types_1.freshInstance(varTy), ty => {
                if (!Context_1.context.identifiers.has(expr.id)) {
                    Context_1.context.identifiers.set(expr.id, [expr.name, Types_1.polyTy(ty)]);
                }
                return checkedUnify(tau, ty, expr);
            });
        }
        case 'if_then_else': {
            return Result_1.bind(collectExprTypeSubsts(env, expr.cond, FixedTypes_1.boolTy), sig1 => {
                return Result_1.bind(Unification_1.substituteEnv(env, sig1), sig1Gamma => {
                    return Result_1.bind(Unification_1.substituteMono(tau, sig1), sig1Tau => {
                        return Result_1.bind(collectExprTypeSubsts(sig1Gamma, expr.thenBranch, sig1Tau), sig2 => {
                            return Result_1.bind(Unification_1.substituteEnv(sig1Gamma, sig2), sig21Gamma => {
                                return Result_1.bind(Unification_1.substituteMono(sig1Tau, sig2), sig21Tau => {
                                    return Result_1.bind(collectExprTypeSubsts(sig21Gamma, expr.elseBranch, sig21Tau), sig3 => {
                                        return Unification_1.substCompose(sig3, sig2, sig1);
                                    });
                                });
                            });
                        });
                    });
                });
            });
        }
        case 'lambda': {
            const tau1 = Types_1.freshTyVar();
            const tau2 = Types_1.freshTyVar();
            const gammaX = envAdd(env, expr.arg, Types_1.polyTy(tau1));
            return Result_1.bind(collectExprTypeSubsts(gammaX, expr.body, tau2), sig => {
                return Result_1.bind(Unification_1.substituteMono(FixedTypes_1.funTy(tau1, tau2), sig), sigExpTy => {
                    return Result_1.bind(Unification_1.substituteMono(tau, sig), sigTau => {
                        return Result_1.bind(checkedUnify(sigTau, sigExpTy, expr), sig2 => {
                            return Unification_1.substCompose(sig2, sig);
                        });
                    });
                });
            });
        }
        case 'app': {
            const tau1 = Types_1.freshTyVar();
            return Result_1.bind(collectExprTypeSubsts(env, expr.lhs, FixedTypes_1.funTy(tau1, tau)), sig1 => {
                return Result_1.bind(Unification_1.substituteEnv(env, sig1), sig1Gamma => {
                    return Result_1.bind(Unification_1.substituteMono(tau1, sig1), sig1Tau1 => {
                        return Result_1.bind(collectExprTypeSubsts(sig1Gamma, expr.rhs, sig1Tau1), sig2 => {
                            return Unification_1.substCompose(sig2, sig1);
                        });
                    });
                });
            });
        }
        case 'let_in': {
            const tau1 = Types_1.freshTyVar();
            return Result_1.bind(collectExprTypeSubsts(env, expr.middle, tau1), sig1 => {
                return Result_1.bind(Unification_1.substituteEnv(env, sig1), sig1Gamma => {
                    return Result_1.bind(Unification_1.substituteMono(tau1, sig1), sig1Tau1 => {
                        return Result_1.bind(Unification_1.substituteMono(tau, sig1), sig1Tau => {
                            const sig1Tau1Gen = Types_1.generalizeTy(Env_1.envRem(sig1Gamma, expr.left.name), sig1Tau1);
                            const gammaX = envAdd(sig1Gamma, expr.left, sig1Tau1Gen);
                            return Result_1.bind(collectExprTypeSubsts(gammaX, expr.right, sig1Tau), sig2 => {
                                return Unification_1.substCompose(sig2, sig1);
                            });
                        });
                    });
                });
            });
        }
        case 'let_rec_in': {
            const tau1 = Types_1.freshTyVar();
            const tau2 = Types_1.freshTyVar();
            const fTy = FixedTypes_1.funTy(tau1, tau2);
            const gammaX = envAdd(env, expr.arg, Types_1.polyTy(tau1));
            const gammaF = envAdd(gammaX, expr.funName, Types_1.polyTy(fTy));
            return Result_1.bind(collectExprTypeSubsts(gammaF, expr.middle, tau2), sig1 => {
                return Result_1.bind(Unification_1.substituteEnv(env, sig1), sig1Gamma => {
                    return Result_1.bind(Unification_1.substituteMono(fTy, sig1), sig1FTy => {
                        return Result_1.bind(Unification_1.substituteMono(tau, sig1), sig1Tau => {
                            const gammaF = envAdd(sig1Gamma, expr.funName, Types_1.generalizeTy(sig1Gamma, sig1FTy));
                            return Result_1.bind(collectExprTypeSubsts(gammaF, expr.right, sig1Tau), sig2 => {
                                return Unification_1.substCompose(sig2, sig1);
                            });
                        });
                    });
                });
            });
        }
        case 'tyconst': {
            if (Context_1.context.datatypes.has(expr.name)) {
                const constructorTy = Common_1.defined(Context_1.context.datatypes.get(expr.name));
                // the type of the variant is the last type
                // of the variant constructor
                const variantTy = Types_1.freshInstance(Types_1.polyTy(FixedTypes_1.funReturnTy(constructorTy.ty), ...constructorTy.polyVars));
                return Result_1.bind(variantTy, variantTy => {
                    return checkedUnify(tau, variantTy, expr);
                });
            }
            else if (expr.name === '()') { // unit
                return checkedUnify(tau, FixedTypes_1.unitTy, expr);
            }
            else if (expr.name === 'tuple') { // tuples
                const n = expr.args.length;
                const tupleTy = Types_1.tyConst('tuple', ...Common_1.gen(n, Types_1.freshTyVar));
                return Result_1.bind(checkedUnify(tupleTy, tau, expr), sig0 => {
                    const res = Result_1.fold(tupleTy.args, ([sig, gamma, i], tau_i) => {
                        return Result_1.bind(collectExprTypeSubsts(gamma, expr.args[i], tau_i), sig_i => {
                            return Result_1.bind(Unification_1.substituteEnv(gamma, sig_i), gamma_n => {
                                return Result_1.bind(Unification_1.substCompose(sig_i, sig), sig_n => {
                                    return Result_1.ok([sig_n, gamma_n, i + 1]);
                                });
                            });
                        });
                    }, [sig0, env, 0]);
                    return Result_1.bind(res, ([sig]) => {
                        return Result_1.ok(sig);
                    });
                });
            }
            else {
                return Result_1.error(`unknown type constructor: "${expr.name}"`);
            }
        }
        case 'case_of': {
            const tau_e = Types_1.freshTyVar();
            return Result_1.bind(collectExprTypeSubsts(env, expr.value, tau_e), sig_e0 => {
                const res = Result_1.bind(Unification_1.substituteMono(tau, sig_e0), sig_e0_tau => {
                    return Result_1.bind(Unification_1.substituteMono(tau_e, sig_e0), sig_e0_tau_e => {
                        return Result_1.fold(expr.cases, ([sig_i, tau_i, tau_e_i], { pattern: p_n, expr: e_n }) => {
                            const vars = {};
                            return Result_1.bind(Pattern_1.collectPatternSubst(env, p_n, tau_e_i, vars), sig_p => {
                                return Result_1.bind(Unification_1.substCompose(sig_p, sig_i), sig_p_i => {
                                    return Result_1.bind(Unification_1.substituteMono(tau_e_i, sig_p), sig_p_tau_e_n => {
                                        return Result_1.bind(Unification_1.substituteEnv(Env_1.envSum(env, vars), sig_p_i), gamma_vars => {
                                            return Result_1.bind(Unification_1.substituteMono(tau_i, sig_p), sig_e_tau_i => {
                                                return Result_1.bind(collectExprTypeSubsts(gamma_vars, e_n, sig_e_tau_i), sig => {
                                                    return Result_1.bind(Unification_1.substCompose(sig, sig_p_i), sig_n => {
                                                        return Result_1.bind(Unification_1.substituteMono(sig_e_tau_i, sig), tau_n => {
                                                            return Result_1.bind(Unification_1.substituteMono(sig_p_tau_e_n, sig), tau_e_n => {
                                                                return Result_1.ok([sig_n, tau_n, tau_e_n]);
                                                            });
                                                        });
                                                    });
                                                });
                                            });
                                        });
                                    });
                                });
                            });
                        }, [sig_e0, sig_e0_tau, sig_e0_tau_e]);
                    });
                });
                return Result_1.bind(res, ([sig_n]) => {
                    return Result_1.ok(sig_n);
                });
            });
        }
    }
};
const registerDataTypeDecls = (dataTypeDecls) => {
    for (const { name, typeVars, variants } of dataTypeDecls) {
        const ty = Types_1.tyConst(name, ...typeVars);
        for (const variant of variants) {
            const variantTy = variant.args.length === 0 ?
                ty :
                FixedTypes_1.funTy(variant.args[0], ...variant.args.slice(1), ty);
            Common_1.assert(Types_1.isTyConst(variantTy));
            const realType = Types_1.polyTy(Types_1.tyConst(variantTy.name, ...variantTy.args), ...typeVars);
            // add this variant to the context
            Context_1.context.datatypes.set(variant.name, realType);
        }
    }
};
const registerTypeClassDecls = (typeClassDecls) => {
    for (const { name, tyVar, methods } of typeClassDecls) {
        if (!Context_1.context.typeclasses.has(name)) {
            Context_1.context.typeclasses.set(name, {
                methods: new Map(),
                tyVar: tyVar
            });
        }
        for (const [f, ty] of methods) {
            Context_1.context.typeclasses.get(name)?.methods.set(f, ty);
            Context_1.context.typeClassMethods.set(f, ty);
        }
    }
};
const registerInstanceDecls = (instances) => {
    for (const { class_, ty } of instances) {
        if (!Context_1.context.instances.has(class_)) {
            Context_1.context.instances.set(class_, []);
        }
        const instTyName = Types_1.isTyConst(ty) ? ty.name : '*';
        // add this instance to the context
        Context_1.context.instances.get(class_)?.push(instTyName);
    }
};
const registerTypeDecls = (prog) => {
    registerDataTypeDecls(prog.datatypes.values());
    registerTypeClassDecls(prog.typeclasses.values());
    registerInstanceDecls(prog.instances);
};
exports.registerTypeDecls = registerTypeDecls;
const replaceTyVar = (ty, tyVar, by) => {
    if (Types_1.isTyVar(ty)) {
        if (ty.value === tyVar)
            return by;
        return ty;
    }
    return Types_1.tyConst(ty.name, ...ty.args.map(a => replaceTyVar(a, tyVar, by)));
};
const instanceMethodsTypes = (inst) => {
    const methodsTys = new Map();
    for (const method of inst.defs.keys()) {
        if (!Context_1.context.typeclasses.has(inst.class_)) {
            return Result_1.error(`cannot define an instance for '${Types_1.showMonoTy(inst.ty)}', type class '${inst.class_}' not found.`);
        }
        const class_ = Common_1.defined(Context_1.context.typeclasses.get(inst.class_));
        if (!class_.methods.has(method)) {
            return Result_1.error(`'${method}' is not a valid method of type class '${inst.class_}'`);
        }
        const instMethodTy_ = Common_1.defined(class_.methods.get(method));
        const instMethodTy = replaceTyVar(instMethodTy_.ty, class_.tyVar, inst.ty);
        methodsTys.set(method, instMethodTy);
    }
    return Result_1.ok(methodsTys);
};
exports.instanceMethodsTypes = instanceMethodsTypes;
const typeCheckInstances = (instances) => {
    let subst = {};
    for (const inst of instances) {
        const tys = exports.instanceMethodsTypes(inst);
        if (Result_1.isError(tys))
            return tys;
        for (const [method, ty] of tys.value.entries()) {
            if (!inst.defs.has(method)) {
                return Result_1.error(`type class instance for '${inst.class_} ${Types_1.showMonoTy(ty)}' is missing method '${method}'`);
            }
            const [tyVar] = Common_1.defined(inst.defs.get(method));
            const [_, inferedTy] = Common_1.defined(Context_1.context.identifiers.get(tyVar));
            const sig = Unification_1.unify(ty, inferedTy.ty);
            if (Result_1.isError(sig)) {
                return Result_1.error(`invalid type for method '${method}' of type class '${inst.class_}'`);
            }
            const subst_ = Unification_1.substCompose(subst, sig.value);
            if (Result_1.isOk(subst_)) {
                subst = subst_.value;
            }
            else {
                return subst_;
            }
        }
    }
    return Result_1.ok(subst);
};
exports.typeCheckInstances = typeCheckInstances;
