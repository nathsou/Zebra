import { assert } from "https://deno.land/std@0.73.0/testing/asserts.ts";
import { CoreDecl, CoreFuncDecl } from "../Core/CoreDecl.ts";
import { CoreExpr } from "../Core/CoreExpr.ts";
import { collectPatternSubst } from "../Interpreter/Pattern.ts";
import { Expr, showExpr } from "../Parser/Expr.ts";
import { gen } from "../Utils/Common.ts";
import { emptyEnv, envAdd, envGet, envHas, envSum } from "../Utils/Env.ts";
import { isNone } from "../Utils/Mabye.ts";
import { bind, error, fold, ok, Result } from "../Utils/Result.ts";
import { binopTy, boolTy, constantTy, funReturnTy, funTy, unitTy } from "./FixedTypes.ts";
import { freshInstance, freshTyVar, generalizeTy, isTyConst, MonoTy, PolyTy, polyTy, resetTyVars, showMonoTy, tyConst, TypeEnv } from "./Types.ts";
import { showSubst, substCompose, substituteEnv, substituteMono, TypeSubst, unify } from "./Unification.ts";

export type TypeError = string;
export type TypeCheckerResult = Result<MonoTy, TypeError>;

/**
 * infers the most general monomorphic type of an expression
 * @returns None if type checking failed
 */
export const inferExprType = (expr: CoreExpr, env: TypeEnv = {}): TypeCheckerResult => {
    const tau = freshTyVar();
    return bind(collectExprTypeSubsts(env, expr, tau), sig => {
        resetTyVars();

        if (sig[tau] === undefined) {
            return error(`unbound type variable: "${showMonoTy(tau)}" in ${showSubst(sig)}`);
        }

        return ok(substituteMono(sig[tau], sig));
    });
};

const checkedUnify = (s: MonoTy, t: MonoTy, expr: Expr): Result<TypeSubst, TypeError> => {
    const sig = unify(s, t);

    if (isNone(sig)) {
        return error(`cannot unify ${showMonoTy(s)} with ${showMonoTy(t)} in expression "${showExpr(expr)}"`);
    }

    return ok(sig);
};

const collectExprTypeSubsts = (env: TypeEnv, expr: CoreExpr, tau: MonoTy): Result<TypeSubst, TypeError> => {
    switch (expr.type) {
        case 'constant': {
            let tau_ = constantTy(expr);
            return checkedUnify(tau, freshInstance(tau_), expr);
        }
        case 'variable': {
            if (!envHas(env, expr.name)) {
                throw new Error(`unbound variable "${expr.name}"`);
            }

            const ty = freshInstance(envGet(env, expr.name));

            return checkedUnify(tau, ty, expr);
        }
        case 'binop': {
            const tau_ = binopTy(expr.operator);
            if (isNone(tau_)) {
                throw new Error(`unknown binary operator "${expr.operator}"`);
            }

            const tau1 = freshTyVar();
            const tau2 = freshTyVar();

            return bind(collectExprTypeSubsts(env, expr.left, tau1), sig1 => {
                return bind(collectExprTypeSubsts(substituteEnv(env, sig1), expr.right, tau2), sig2 => {
                    const expTy = funTy(tau1, funTy(tau2, tau));
                    const sig = substCompose(sig2, sig1);
                    return bind(checkedUnify(substituteMono(expTy, sig), freshInstance(tau_), expr), sig3 => {
                        return ok(substCompose(sig3, sig));
                    });
                });
            });
        }
        case 'if_then_else': {
            return bind(collectExprTypeSubsts(env, expr.cond, boolTy), sig1 => {
                const sig1Gamma = substituteEnv(env, sig1);
                const sig1Tau = substituteMono(tau, sig1);
                return bind(collectExprTypeSubsts(sig1Gamma, expr.thenBranch, sig1Tau), sig2 => {
                    const sig21Gamma = substituteEnv(sig1Gamma, sig2);
                    const sig21Tau = substituteMono(sig1Tau, sig2);
                    return bind(collectExprTypeSubsts(sig21Gamma, expr.elseBranch, sig21Tau), sig3 => {
                        return ok(substCompose(sig3, sig2, sig1));
                    });
                });
            });
        }
        case 'lambda': {
            const tau1 = freshTyVar();
            const tau2 = freshTyVar();
            const gammaX = envAdd(env, expr.arg, polyTy(tau1));
            return bind(collectExprTypeSubsts(gammaX, expr.body, tau2), sig => {
                const sigExpTy = substituteMono(funTy(tau1, tau2), sig);
                const sigTau = substituteMono(tau, sig);
                return bind(checkedUnify(sigTau, sigExpTy, expr), sig2 => {
                    return ok(substCompose(sig2, sig));
                });
            });
        }
        case 'app': {
            const tau1 = freshTyVar();
            return bind(collectExprTypeSubsts(env, expr.lhs, funTy(tau1, tau)), sig1 => {
                const sig1Gamma = substituteEnv(env, sig1);
                const sig1Tau1 = substituteMono(tau1, sig1);
                return bind(collectExprTypeSubsts(sig1Gamma, expr.rhs, sig1Tau1), sig2 => {
                    return ok(substCompose(sig2, sig1));
                });
            });
        }
        case 'let_in': {
            const tau1 = freshTyVar();
            return bind(collectExprTypeSubsts(env, expr.middle, tau1), sig1 => {
                const sig1Gamma = substituteEnv(env, sig1);
                const sig1Tau1 = substituteMono(tau1, sig1);
                const sig1Tau = substituteMono(tau, sig1);
                const gammaX = envAdd(env, expr.left, generalizeTy(sig1Gamma, sig1Tau1));
                return bind(collectExprTypeSubsts(gammaX, expr.right, sig1Tau), sig2 => {
                    return ok(substCompose(sig2, sig1));
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
                const sig1Gamma = substituteEnv(env, sig1);
                const sig1FTy = substituteMono(fTy, sig1);
                const sig1Tau = substituteMono(tau, sig1);
                const gammaF = envAdd(sig1Gamma, expr.funName, generalizeTy(sig1Gamma, sig1FTy));
                return bind(collectExprTypeSubsts(gammaF, expr.right, sig1Tau), sig2 => {
                    return ok(substCompose(sig2, sig1));
                });
            });
        }
        case 'tyconst': {
            if (envHas(env, expr.name)) {
                const constructorTy = envGet(env, expr.name);

                // the type of the variant is the last type
                // of the variant constructor
                const variantTy = freshInstance(polyTy(funReturnTy(constructorTy.ty), ...constructorTy.polyVars));

                return checkedUnify(tau, variantTy, expr);
            } else if (expr.name === '()') { // unit
                return checkedUnify(tau, unitTy, expr);
            } else if (expr.name === 'tuple') { // tuples
                const n = expr.args.length;
                const tupleTy = tyConst(expr.name, ...gen(n, () => freshTyVar()));

                const res = fold(tupleTy.args, ([sig, gamma, i], tau_i) => {
                    return bind(collectExprTypeSubsts(gamma, expr.args[i], tau_i), sig_i => {
                        const gamma_n = substituteEnv(gamma, sig_i);
                        const sig_n = substCompose(sig_i, sig);
                        return ok([sig_n, gamma_n, i + 1] as const);
                    });
                }, [{} as TypeSubst, env, 0 as number] as const);

                return bind(res, ([sig]) => {
                    return checkedUnify(substituteMono(tau, sig), substituteMono(tupleTy, sig), expr)
                });
            } else {
                return error(`unknown type variant: "${expr.name}"`);
            }
        }
        case 'case_of': {
            const tau_e = freshTyVar();
            return bind(collectExprTypeSubsts(env, expr.value, tau_e), sig_e0 => {
                const res = fold(expr.cases, ([sig_i, tau_i, tau_e_i], { pattern: p_n, expr: e_n }) => {
                    const vars: Record<string, PolyTy> = {};
                    return bind(collectPatternSubst(env, p_n, tau_e_i, vars), sig_p => {
                        const sig_p_i = substCompose(sig_p, sig_i);
                        const sig_p_tau_e_n = substituteMono(tau_e_i, sig_p);
                        const gamma_vars = substituteEnv(envSum(env, vars), sig_p_i);
                        const sig_e_tau_i = substituteMono(tau_i, sig_p);
                        return bind(collectExprTypeSubsts(gamma_vars, e_n, sig_e_tau_i), sig => {
                            const sig_n = substCompose(sig, sig_p_i);
                            const tau_n = substituteMono(sig_e_tau_i, sig);
                            const tau_e_n = substituteMono(sig_p_tau_e_n, sig);
                            return ok([sig_n, tau_n, tau_e_n] as const);
                        });
                    });
                }, [sig_e0, substituteMono(tau, sig_e0), substituteMono(tau_e, sig_e0)] as const);

                return bind(res, ([sig_n, _]) => {
                    return ok(sig_n);
                });
            });
        }
    }
};

export const registerDeclTypes = (decls: CoreDecl[]): Result<TypeEnv, TypeError> => {
    let gamma = emptyEnv<PolyTy>();

    const funs: Array<CoreFuncDecl> = [];

    for (const decl of decls) {
        switch (decl.type) {
            case 'fun': // assign a fresh type variable to each function
                {
                    const tau = freshTyVar();
                    gamma = envAdd(gamma, decl.name, polyTy(tau));
                    funs.push(decl);
                    break;
                }
            case 'datatype':
                {
                    const ty = tyConst(decl.name, ...decl.typeVars);

                    for (const variant of decl.variants) {
                        const variantTy = variant.args.length === 0 ?
                            ty :
                            funTy(variant.args[0], ...variant.args.slice(1), ty);

                        assert(isTyConst(variantTy));

                        const realType = polyTy(tyConst(variantTy.name, ...variantTy.args), ...decl.typeVars);
                        gamma = envAdd(gamma, variant.name, realType);
                    }
                    break;
                }
        }
    }

    return fold(funs, (gamma, fun) => collectDeclTypes(gamma, fun), gamma);
};

const collectDeclTypes = (env: TypeEnv, decl: CoreDecl): Result<TypeEnv, TypeError> => {
    switch (decl.type) {
        case 'fun':
            {
                const tau = envGet(env, decl.name);

                const argsTypes = decl.args.map(() => freshTyVar());
                // return type
                const retTy = freshTyVar();

                const fTy = argsTypes.length > 1 ?
                    funTy(argsTypes[0], argsTypes[1], ...argsTypes.slice(2), retTy) :
                    argsTypes.length === 1 ?
                        funTy(argsTypes[0], retTy) :
                        funTy(unitTy, retTy);

                const gammaArgs = argsTypes.reduce((env, ty, idx) => envAdd(env, decl.args[idx], polyTy(ty)), env);
                const gammaF = envAdd(gammaArgs, decl.name, polyTy(fTy));
                return bind(collectExprTypeSubsts(gammaF, decl.body, retTy), sig => {
                    const sigGamma = substituteEnv(env, sig);
                    const sigFTy = substituteMono(fTy, sig);
                    const gammaF = envAdd(sigGamma, decl.name, generalizeTy(sigGamma, sigFTy));
                    return bind(checkedUnify(substituteMono(freshInstance(tau), sig), sigFTy, decl.body), sig2 => {
                        const sigGamma2 = substituteEnv(gammaF, sig2);
                        return ok(sigGamma2);
                    });
                });
            }
        case 'datatype': {
            return ok(env);
        }
    }
};