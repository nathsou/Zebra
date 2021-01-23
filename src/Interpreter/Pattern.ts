import { charTy, floatTy, intTy, tupleTy, uncurryFun } from "../Inferencer/FixedTypes.ts";
import { freshInstance, freshTyVar, MonoTy, polyTy, PolyTy, showMonoTy, TypeEnv } from "../Inferencer/Types.ts";
import { substCompose, substituteEnv, substituteMono, TypeSubst, unify } from "../Inferencer/Unification.ts";
import { envGet, envHas } from "../Utils/Env.ts";
import { isNone, Maybe, None } from "../Utils/Maybe.ts";
import { bind, error, fold, isError, ok, Result } from "../Utils/Result.ts";
import { Value } from "./Value.ts";

export type Pattern = Var | Fun;

export type Var = string;
export type Fun = { name: string, args: Pattern[] };
export type ValSubst = { [x: string]: Value };

export function isVar(x: Pattern): x is Var {
    return typeof x === 'string';
}

export function isFun(f: Pattern): f is Fun {
    return typeof f === 'object';
}

export const vars = (p: Pattern, acc: Set<Var> = new Set()): Set<Var> => {
    if (isVar(p)) {
        acc.add(p);
        return acc;
    }

    for (const arg of p.args) {
        vars(arg, acc);
    }

    return acc;
};


export const unifyPattern = (p: Pattern, v: Value): Maybe<ValSubst> => unifyPatternMany([[p, v]]);

const unifyPatternMany = (eqs: Array<[Pattern, Value]>): Maybe<ValSubst> => {
    const sig: ValSubst = {};

    while (eqs.length > 0) {
        const [p, v] = eqs.pop() as [Pattern, Value];


        if (isVar(p)) { // Eliminate
            const x = p;
            sig[x] = v;
            continue;
        }

        if (p.name === '_') continue;

        switch (v.type) {
            case 'int':
                if (p.name !== `${v.value}`) {
                    return None;
                }
                continue;
            case 'char':
                if (p.name !== `'${v.value}'`) {
                    return None;
                }
                continue;
            case 'tyconst': // Decompose
                if (
                    p.name === v.name &&
                    p.args.length === v.args.length
                ) {
                    for (let i = 0; i < p.args.length; i++) {
                        eqs.push([p.args[i], v.args[i]]);
                    }
                    continue;
                }
                return None;
            default:
                return None;
        }
    }

    return sig;
};

export const checkedUnify = (
    s: MonoTy,
    t: MonoTy,
    p: Pattern,
    instances: Map<string, string[]>
): Result<TypeSubst, string> => {
    const sig = unify(s, t, instances);

    if (isError(sig)) {
        return error(`${sig.value} : cannot unify ${showMonoTy(s)} with ${showMonoTy(t)} in pattern "${showPattern(p)}"`);
    }

    return sig;
};

export const collectPatternSubst = (
    env: TypeEnv,
    p: Pattern,
    tau: MonoTy,
    vars: Record<string, PolyTy>,
    instances: Map<string, string[]>
): Result<TypeSubst, string> => {

    const unif = (s: MonoTy, t: MonoTy, pat: Pattern) =>
        checkedUnify(s, t, pat, instances);

    // TODO: clean up
    if (isVar(p)) {
        // if this is a datatype variant
        if ((p[0] === p[0].toUpperCase()) && envHas(env, p)) {
            return bind(freshInstance(envGet(env, p), instances), freshTy => {
                return unif(tau, freshTy, p);
            });
        } else if (vars[p] !== undefined) {
            return bind(freshInstance(vars[p], instances), freshTy => {
                return unif(tau, freshTy, p);
            });
        } else {
            const ty = freshTyVar();
            vars[p] = polyTy(ty);
            return unif(tau, ty, p);
        }
    }

    if (p.name === '_') {
        return unif(tau, freshTyVar(), p);
    }

    // integers
    if (/[0-9]+/.test(p.name)) {
        return unif(tau, intTy, p);
    }

    // floats
    if (/[0-9]*\.[0-9]+/.test(p.name)) {
        return unif(tau, floatTy, p);
    }

    // characters
    if (p.name[0] === "'") {
        return unif(tau, charTy, p);
    }

    const constructorTy = p.name === 'tuple' ?
        tupleTy(p.args.length) :
        envGet(env, p.name);

    if (isNone(constructorTy)) {
        return error(`unknown variant: ${p.name} in pattern "${showPattern(p)}"`);
    }

    const freshCtorTy = freshInstance(constructorTy, instances);
    if (isError(freshCtorTy)) return freshCtorTy;

    const tys = uncurryFun(freshCtorTy.value);
    const retTy = tys.pop() as MonoTy;

    const res = fold(tys, ([sig_i, gamma_i], tau_i, i) => {
        return bind(substituteMono(tau_i, sig_i, instances), sig_i_tau_i => {
            return bind(collectPatternSubst(gamma_i, p.args[i], sig_i_tau_i, vars, instances), sig => {
                return bind(substituteEnv(gamma_i, sig, instances), gamma_n => {
                    return bind(substCompose(instances, sig, sig_i), sig_n => {
                        return ok([sig_n, gamma_n] as const);
                    });
                });
            });
        });
    }, [{} as TypeSubst, env] as const);

    return bind(res, ([sig_n]) => {
        return bind(substituteMono(retTy, sig_n, instances), s => {
            return bind(substituteMono(tau, sig_n, instances), t => {
                return bind(unif(s, t, p), sig2 => {
                    return substCompose(instances, sig2, sig_n);
                });
            });
        });
    });
};

export const showPattern = (p: Pattern): string => {
    if (isVar(p)) return p;
    if (p.args.length === 0) return p.name;
    if (p.name === 'tuple') {
        return `(${p.args.map(showPattern).join(', ')})`;
    }
    return `${p.name} ${p.args.map(showPattern).join(' ')}`;
};