import { Expr, showExpr } from "../Parser/Expr.ts";
import { envAdd, envGet, envHas } from "../Utils/Env.ts";
import { isNone } from "../Utils/Mabye.ts";
import { Result, bind, error, ok, isError } from "../Utils/Result.ts";
import { binopTy, boolTy, constantTy, funTy } from "./FixedTypes.ts";
import { freshInstance, freshTyVar, generalizeTy, MonoTy, polyTy, showMonoTy, showTypeEnv, TypeEnv } from "./Types.ts";
import { showSubst, substCompose, substituteEnv, substituteMono, TypeSubst, unify } from "./Unification.ts";

export type TypeError = string;
export type TypeCheckerResult = Result<MonoTy, TypeError>;

/**
 * infers the most general monomorphic type of an expression
 * @returns None if type checking failed
 */
export const inferExprType = (expr: Expr): TypeCheckerResult => {
    const tau = freshTyVar();
    return bind(collectTypeSubsts({}, expr, tau), sig => {
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

const collectTypeSubsts = (env: TypeEnv, expr: Expr, tau: MonoTy): Result<TypeSubst, TypeError> => {
    switch (expr.type) {
        case 'constant':
            {
                let tau_ = constantTy(expr);
                return checkedUnify(tau, freshInstance(tau_), expr);
            }
        case 'identifier':
            if (!envHas(env, expr.name)) {
                throw new Error(`type checker: unbound variable "${expr.name}"`);
            }

            return checkedUnify(tau, freshInstance(envGet(env, expr.name)), expr);
        case 'binop':
            {
                const tau_ = binopTy(expr.operator);
                if (isNone(tau_)) {
                    throw new Error(`unknown binary operator "${expr.operator}"`);
                }

                const tau1 = freshTyVar();
                const tau2 = freshTyVar();

                return bind(collectTypeSubsts(env, expr.left, tau1), sig1 => {
                    return bind(collectTypeSubsts(substituteEnv(env, sig1), expr.right, tau2), sig2 => {
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
                return bind(collectTypeSubsts(env, expr.cond, boolTy), sig1 => {
                    const sig1Gamma = substituteEnv(env, sig1);
                    const sig1Tau = substituteMono(tau, sig1);
                    return bind(collectTypeSubsts(sig1Gamma, expr.thenBranch, sig1Tau), sig2 => {
                        const sig21Gamma = substituteEnv(sig1Gamma, sig2);
                        const sig21Tau = substituteMono(sig1Tau, sig2);
                        return bind(collectTypeSubsts(sig21Gamma, expr.elseBranch, sig21Tau), sig3 => {
                            return ok(substCompose(sig3, sig2, sig1));
                        });
                    });
                });
            }
        case 'lambda':
            {
                const tau1 = freshTyVar();
                const tau2 = freshTyVar();
                const gammaX = envAdd(env, expr.arg, polyTy(tau1));
                return bind(collectTypeSubsts(gammaX, expr.body, tau2), sig => {
                    const sigExpTy = substituteMono(funTy(tau1, tau2), sig);
                    const sigTau = substituteMono(tau, sig);
                    return bind(checkedUnify(sigTau, sigExpTy, expr), sig2 => {
                        return ok(substCompose(sig2, sig));
                    });
                });
            }
        case 'app':
            {
                const tau1 = freshTyVar();
                return bind(collectTypeSubsts(env, expr.lhs, funTy(tau1, tau)), sig1 => {
                    const sig1Gamma = substituteEnv(env, sig1);
                    const sig1Tau1 = substituteMono(tau1, sig1);
                    return bind(collectTypeSubsts(sig1Gamma, expr.rhs, sig1Tau1), sig2 => {
                        return ok(substCompose(sig2, sig1));
                    });
                });
            }
        case 'let_in':
            {
                const tau1 = freshTyVar();
                return bind(collectTypeSubsts(env, expr.middle, tau1), sig1 => {
                    const sig1Gamma = substituteEnv(env, sig1);
                    const sig1Tau1 = substituteMono(tau1, sig1);
                    const sig1Tau = substituteMono(tau, sig1);
                    const gammaX = envAdd(env, expr.left, generalizeTy(sig1Gamma, sig1Tau1));
                    return bind(collectTypeSubsts(gammaX, expr.right, sig1Tau), sig2 => {
                        return ok(substCompose(sig2, sig1));
                    });
                });
            }
        case 'let_rec_in':
            {
                const tau1 = freshTyVar();
                const tau2 = freshTyVar();
                const fTy = funTy(tau1, tau2);
                const gammaX = envAdd(env, expr.arg, polyTy(tau1));
                const gammaF = envAdd(gammaX, expr.funName, polyTy(fTy));
                return bind(collectTypeSubsts(gammaF, expr.middle, tau2), sig1 => {
                    const sig1Gamma = substituteEnv(env, sig1);
                    const sig1FTy = substituteMono(fTy, sig1);
                    const sig1Tau = substituteMono(tau, sig1);
                    const gammaF = envAdd(sig1Gamma, expr.funName, generalizeTy(sig1Gamma, sig1FTy));
                    return bind(collectTypeSubsts(gammaF, expr.right, sig1Tau), sig2 => {
                        return ok(substCompose(sig2, sig1));
                    });
                });
            }
        case 'tyconst':
            {
                if (expr.name === 'True' || expr.name === 'False') {
                    return checkedUnify(tau, boolTy, expr);
                }

                throw new Error(`unknown type variant: "${showExpr(expr)}"`);
            }
    }
};