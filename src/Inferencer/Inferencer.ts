import { assert } from "https://deno.land/std@0.73.0/testing/asserts.ts";
import { typeOfPattern } from "../Interpreter/Pattern.ts";
import { Decl } from "../Parser/Decl.ts";
import { Expr, showExpr } from "../Parser/Expr.ts";
import { emptyEnv, envAdd, envGet, envHas, envMap, envSum } from "../Utils/Env.ts";
import { isNone } from "../Utils/Mabye.ts";
import { bind, error, ok, Result } from "../Utils/Result.ts";
import { binopTy, boolTy, constantTy, funReturnTy, funTy, unitTy } from "./FixedTypes.ts";
import { freshInstance, freshTyVar, generalizeTy, isTyConst, MonoTy, PolyTy, polyTy, resetTyVars, showMonoTy, tyConst, TypeEnv } from "./Types.ts";
import { showSubst, substCompose, substituteEnv, substituteMono, TypeSubst, unify } from "./Unification.ts";

export type TypeError = string;
export type TypeCheckerResult = Result<MonoTy, TypeError>;

/**
 * infers the most general monomorphic type of an expression
 * @returns None if type checking failed
 */
export const inferExprType = (expr: Expr, env: TypeEnv = {}): TypeCheckerResult => {
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

const collectExprTypeSubsts = (env: TypeEnv, expr: Expr, tau: MonoTy): Result<TypeSubst, TypeError> => {
    switch (expr.type) {
        case 'constant':
            {
                let tau_ = constantTy(expr);
                return checkedUnify(tau, freshInstance(tau_), expr);
            }
        case 'variable':
            if (!envHas(env, expr.name)) {
                throw new Error(`unbound variable "${expr.name}"`);
            }

            const ty = freshInstance(envGet(env, expr.name));

            return checkedUnify(tau, ty, expr);
        case 'binop':
            {
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
        case 'if_then_else':
            {
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
        case 'lambda':
            {
                const sig: Record<string, PolyTy> = {};
                const tau1 = typeOfPattern(expr.arg, sig, env);
                const retTy = freshTyVar();
                const gammaVars = envSum(env, sig);

                return bind(collectExprTypeSubsts(gammaVars, expr.body, retTy), sig => {
                    const sigExpTy = substituteMono(funTy(tau1.ty, retTy), sig);
                    const sigTau = substituteMono(tau, sig);
                    return bind(checkedUnify(sigTau, sigExpTy, expr), sig2 => {
                        return ok(substCompose(sig2, sig));
                    });
                });
            }
        case 'app':
            {
                const tau1 = freshTyVar();
                return bind(collectExprTypeSubsts(env, expr.lhs, funTy(tau1, tau)), sig1 => {
                    const sig1Gamma = substituteEnv(env, sig1);
                    const sig1Tau1 = substituteMono(tau1, sig1);
                    return bind(collectExprTypeSubsts(sig1Gamma, expr.rhs, sig1Tau1), sig2 => {
                        return ok(substCompose(sig2, sig1));
                    });
                });
            }
        case 'let_in':
            {
                const vars: Record<string, PolyTy> = {};
                const tau1 = typeOfPattern(expr.left, vars, env);
                return bind(collectExprTypeSubsts(env, expr.middle, tau1.ty), sig1 => {
                    const sig1Gamma = substituteEnv(env, sig1);
                    const sig1Tau = substituteMono(tau, sig1);
                    const gammaArgs = envSum(env, envMap(vars, ({ ty }) =>
                        generalizeTy(sig1Gamma, substituteMono(ty, sig1))
                    ));
                    return bind(collectExprTypeSubsts(gammaArgs, expr.right, sig1Tau), sig2 => {
                        return ok(substCompose(sig2, sig1));
                    });
                });
            }
        case 'let_rec_in':
            {
                const vars: Record<string, PolyTy> = {};
                const tau1 = typeOfPattern(expr.arg, vars, env);

                const tau2 = freshTyVar();
                const fTy = funTy(tau1.ty, tau2);

                const gammaArgs = envSum(env, vars);

                const gammaF = envAdd(gammaArgs, expr.funName, polyTy(fTy));
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
        case 'tyconst':
            {
                if (envHas(env, expr.name)) {
                    const constructorTy = envGet(env, expr.name);

                    // the type of the variant is the last type
                    // of the variant constructor
                    const variantTy = freshInstance(polyTy(funReturnTy(constructorTy.ty), ...constructorTy.polyVars));

                    return checkedUnify(tau, variantTy, expr);
                } else if (expr.name === '()') {
                    return checkedUnify(tau, unitTy, expr);
                } else {
                    return error(`unknown type variant: "${expr.name}"`);
                }
            }
    }
};

export const registerDeclTypes = (decls: Decl[]): TypeEnv => {
    let gamma = emptyEnv<PolyTy>();

    for (const decl of decls) {
        switch (decl.type) {
            case 'fun': // assign a fresh type variable to each function
                {
                    gamma = envAdd(gamma, decl.name, polyTy(freshTyVar()));
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

    return gamma;
};

export const collectDeclTypes = (env: TypeEnv, decl: Decl): Result<TypeEnv, TypeError> => {
    switch (decl.type) {
        case 'fun':
            {
                // return type
                const tau = freshTyVar();
                const argsTypes: PolyTy[] = [];

                const sig: Record<string, PolyTy> = {};

                for (const arg of decl.args) {
                    const argTy = typeOfPattern(arg, sig, env);
                    argsTypes.push(argTy);
                }

                const gammaArgs = envSum(env, sig);

                const fTy = funTy(...argsTypes.map(t => t.ty), tau);

                const gammaF = envAdd(gammaArgs, decl.name, polyTy(fTy));
                return bind(collectExprTypeSubsts(gammaF, decl.body, tau), sig => {
                    const sigGamma = substituteEnv(gammaF, sig);
                    const sigFTy = substituteMono(fTy, sig);
                    const gammaF2 = envAdd(sigGamma, decl.name, generalizeTy(sigGamma, sigFTy));
                    return ok(gammaF2);
                });
            }
        case 'datatype': {
            return ok(env);
        }
    }
};