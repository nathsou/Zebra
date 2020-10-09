import { envMap } from "../Utils/Env.ts";
import { Maybe, None, Some } from "../Utils/Mabye.ts";
import { isTyVar, MonoTy, monoTypesEq, PolyTy, showMonoTy, showTyVar, TyConst, tyConst, TypeEnv, TyVar } from "./Types.ts";

export type TypeSubst = Record<TyVar, MonoTy>;

export const unify = (s: MonoTy, t: MonoTy): Maybe<TypeSubst> => {
    return unifyMany([[s, t]]);
};

export function substituteMono(x: TyVar, sig: TypeSubst, excluded?: TyVar[]): MonoTy;
export function substituteMono(t: TyConst, sig: TypeSubst, excluded?: TyVar[]): TyConst;
export function substituteMono(m: MonoTy, sig: TypeSubst, excluded?: TyVar[]): MonoTy;
export function substituteMono(m: MonoTy, sig: TypeSubst, excluded: TyVar[] = []): MonoTy {
    if (isTyVar(m)) {
        if (sig[m] !== undefined && !excluded.includes(m)) {
            if (sig[m] === m) return m;
            return substituteMono(sig[m], sig, excluded);
        } else {
            return m;
        }
    }

    return tyConst(m.name, ...m.args.map(t => substituteMono(t, sig, excluded)));
}

export const freeVarsMonoTy = (ty: MonoTy, acc: Set<TyVar> = new Set()): Set<TyVar> => {
    if (isTyVar(ty)) {
        acc.add(ty);
        return acc;
    }

    for (const t of ty.args) {
        freeVarsMonoTy(t, acc);
    }

    return acc;
};

export const freeVarsPolyTy = ({ polyVars, ty }: PolyTy, acc: Set<TyVar> = new Set()): Set<TyVar> => {
    const vs = freeVarsMonoTy(ty, acc);

    for (const v of vs) {
        if (polyVars.includes(v)) {
            vs.delete(v);
        }
    }

    return vs;
};

export const freeVarsEnv = (env: TypeEnv): Set<TyVar> => {
    const vs = new Set<TyVar>();

    for (const ty of Object.values(env)) {
        freeVarsPolyTy(ty, vs);
    }

    return vs;
};

const renameTyVars = (ty: MonoTy, rename: (x: TyVar) => TyVar): MonoTy => {
    if (isTyVar(ty)) return rename(ty);
    return tyConst(ty.name, ...ty.args.map(t => renameTyVars(t, rename)));
};

export function substitutePoly(t: PolyTy, sig: TypeSubst): PolyTy {
    return { polyVars: t.polyVars, ty: substituteMono(t.ty, sig, t.polyVars) };
}

export const substituteEnv = (env: TypeEnv, sig: TypeSubst): TypeEnv => {
    return envMap(env, t => substitutePoly(t, sig));
};

export const substCompose = (sig1: TypeSubst, ...sigs: TypeSubst[]): TypeSubst => {
    let sig: TypeSubst = { ...sig1 };

    for (const sig2 of sigs) {
        sig = substComposeBin(sig, sig2);
    }

    return sig;
};

const substComposeBin = (sig1: TypeSubst, sig2: TypeSubst): TypeSubst => {
    const sig: Record<string, MonoTy> = {};

    for (const [x, t] of Object.entries(sig1)) {
        sig[x] = substituteMono(t, sig2);
    }

    for (const [y, t] of Object.entries(sig2)) {
        sig[y] = t;
    }

    return sig;
};

const occurs = (x: TyVar, t: MonoTy): boolean => {
    if (isTyVar(t)) return x === t;
    return t.args.some(arg => occurs(x, arg));
};

const unifyMany = (eqs: Array<[MonoTy, MonoTy]>): Maybe<TypeSubst> => {
    const sig: TypeSubst = {};

    while (eqs.length > 0) {
        const [s, t] = eqs.pop() as [MonoTy, MonoTy];
        if (monoTypesEq(s, t)) { // Delete
            continue;
        }

        if (isTyVar(s)) { // Eliminate
            if (occurs(s, t)) {
                return None;
            } else {
                sig[s] = t;
                for (let i = 0; i < eqs.length; i++) {
                    eqs[i][0] = substituteMono(eqs[i][0], sig);
                    eqs[i][1] = substituteMono(eqs[i][1], sig);
                }
                continue;
            }
        }

        if (isTyVar(t)) { // Orient
            eqs.push([t, s]);
            continue;
        }

        if ( // Decompose
            s.name === t.name &&
            s.args.length == t.args.length
        ) {
            for (let i = 0; i < s.args.length; i++) {
                eqs.push([s.args[i], t.args[i]]);
            }
            continue;
        }

        return None;
    }

    return Some(sig);
};

export const substOf = (vars: TyVar[], tys: MonoTy[]): TypeSubst => {
    const sig: TypeSubst = {};

    for (let i = 0; i < Math.min(vars.length, tys.length); i++) {
        sig[vars[i]] = tys[i];
    }

    return sig;
};

export const showSubst = (subst: TypeSubst): string => {
    return `{ ${Object.entries(subst).map(([x, ty]) => `${showTyVar(parseInt(x))} : ${showMonoTy(ty)}`).join(', ')} }`;
};