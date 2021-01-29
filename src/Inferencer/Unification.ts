import { defined, sameElems } from "../Utils/Common.ts";
import { envMapRes } from "../Utils/Env.ts";
import { bind, error, isError, ok, reduceResult, Result, Unit } from "../Utils/Result.ts";
import { context } from "./Context.ts";
import { isTyConst, isTyVar, MonoTy, monoTypesEq, polyTy, PolyTy, showMonoTy, showTyVar, TyConst, tyConst, TypeEnv, tyVar, TyVar } from "./Types.ts";

export type TypeSubst = Record<TyVar['value'], MonoTy>;

export const unify = (
    s: MonoTy,
    t: MonoTy
): Result<TypeSubst, string> => {
    return unifyMany([[s, t]]);
};

export const directedUnify = (
    s: MonoTy,
    t: MonoTy
): Result<TypeSubst, string> => {
    return unifyMany([[s, t]], true);
};

// https://www.researchgate.net/publication/2683816_Implementing_Type_Classes
const propagateClasses = (
    classes: string[],
    ty: MonoTy
): Result<Unit, string> => {
    if (isTyVar(ty)) {
        for (const k of classes) {
            if (!ty.context.includes(k)) {
                ty.context.push(k);
            }
        }
    } else {
        for (const k of classes) {
            const res = propagateClassTyConst(k, ty);
            if (isError(res)) return res;
        }
    }

    return ok('()');
};

const propagateClassTyConst = (
    class_: string,
    ty: TyConst
): Result<Unit, string> => {
    const res = findInstanceContext(ty.name, class_);
    if (isError(res)) return res;

    for (const arg of ty.args) {
        propagateClasses([class_], arg);
    }

    return ok('()');
};

const findInstanceContext = (
    ctor: string,
    class_: string
): Result<Unit, string> => {
    const { instances } = context;

    if (
        !instances.get(class_)?.includes(ctor) &&
        !instances.get(class_)?.includes('*')
    ) {
        return error(`no instance of class ${class_} found for ${ctor}`);
    }

    return ok('()');
};

export function substituteMono(x: TyVar, sig: TypeSubst, excluded?: TyVar['value'][]): Result<MonoTy, string>;
export function substituteMono(t: TyConst, sig: TypeSubst, excluded?: TyVar['value'][]): Result<TyConst, string>;
export function substituteMono(m: MonoTy, sig: TypeSubst, excluded?: TyVar['value'][]): Result<MonoTy, string>;
export function substituteMono(m: MonoTy, sig: TypeSubst, excluded: TyVar['value'][] = []): Result<MonoTy, string> {
    if (isTyVar(m)) {
        if (sig[m.value] !== undefined && !excluded.includes(m.value)) {
            const l = sig[m.value];
            if (
                isTyVar(l) &&
                l.value === m.value &&
                sameElems(l.context, m.context)
            ) {
                return ok({ ...m });
            }

            return bind(substituteMono(l, sig, excluded), ty => {
                const res = propagateClasses(m.context, ty);
                if (isError(res)) return res;

                return ok(ty);
            });

        } else {
            return ok({ ...m });
        }
    }

    return bind(reduceResult(
        m.args.map(t => substituteMono(t, sig, excluded))
    ), args => ok(tyConst(m.name, ...args)));
}

export const freeVarsMonoTy = (ty: MonoTy, acc: Set<TyVar['value']> = new Set()): Set<TyVar['value']> => {
    if (isTyVar(ty)) {
        acc.add(ty.value);
        return acc;
    }

    for (const t of ty.args) {
        freeVarsMonoTy(t, acc);
    }

    return acc;
};

export const freeVarsPolyTy = ({ polyVars, ty }: PolyTy, acc: Set<TyVar['value']> = new Set()): Set<TyVar['value']> => {
    const vs = freeVarsMonoTy(ty, acc);

    for (const v of vs) {
        if (polyVars.includes(v)) {
            vs.delete(v);
        }
    }

    return vs;
};

export const freeVarsEnv = (env: TypeEnv): Set<TyVar['value']> => {
    const vs = new Set<TyVar['value']>();

    for (const ty of Object.values(env)) {
        freeVarsPolyTy(ty, vs);
    }

    return vs;
};

const renameTyVars = (ty: MonoTy, rename: (x: TyVar) => TyVar): MonoTy => {
    if (isTyVar(ty)) return rename(ty);
    return tyConst(ty.name, ...ty.args.map(t => renameTyVars(t, rename)));
};

export function substitutePoly(
    t: PolyTy,
    sig: TypeSubst
): Result<PolyTy, string> {
    return bind(substituteMono(t.ty, sig, t.polyVars), ty => {
        return ok(polyTy(ty, ...t.polyVars));
    });
}

export const substituteEnv = (
    env: TypeEnv,
    sig: TypeSubst
): Result<TypeEnv, string> => {
    return envMapRes(env, t => substitutePoly(t, sig));
};

export const substCompose = (
    sig1: TypeSubst,
    ...sigs: TypeSubst[]
): Result<TypeSubst, string> => {
    let sig: TypeSubst = { ...sig1 };

    for (const sig2 of sigs) {
        const res = substComposeBin(sig, sig2);
        if (isError(res)) return res;
        sig = res.value;
    }

    return ok(sig);
};

const substComposeBin = (
    sig1: TypeSubst,
    sig2: TypeSubst
): Result<TypeSubst, string> => {
    const sig: Record<string, MonoTy> = {};

    for (const [x, t] of Object.entries(sig1)) {
        const res = substituteMono(t, sig2);
        if (isError(res)) return res;

        sig[x] = res.value;
    }

    for (const [y, t] of Object.entries(sig2)) {
        sig[y] = t;
    }

    return ok(sig);
};

const occurs = (x: TyVar, t: MonoTy): boolean => {
    if (isTyVar(t)) return x.value === t.value;
    return t.args.some(arg => occurs(x, arg));
};

const unifyMany = (
    eqs: Array<[MonoTy, MonoTy]>,
    directed = false
): Result<TypeSubst, string> => {
    const sig: TypeSubst = {};

    while (eqs.length > 0) {
        const [s, t] = defined(eqs.pop());

        if (monoTypesEq(s, t)) { // Delete
            continue;
        }

        if (isTyVar(s)) { // Eliminate
            if (occurs(s, t)) {
                return error('occur_check');
            } else {
                const res = propagateClasses(s.context, t);
                if (isError(res)) return res;

                sig[s.value] = t;

                for (let i = 0; i < eqs.length; i++) {
                    const resA = substituteMono(eqs[i][0], sig);
                    if (isError(resA)) return resA;

                    const resB = substituteMono(eqs[i][1], sig);
                    if (isError(resB)) return resB;

                    eqs[i][0] = resA.value;
                    eqs[i][1] = resB.value;
                }
                continue;
            }
        }

        if (!directed && isTyVar(t)) { // Orient
            eqs.push([t, s]);
            continue;
        }

        if ( // Decompose
            isTyConst(s) && isTyConst(t) &&
            s.name === t.name &&
            s.args.length == t.args.length
        ) {
            for (let i = 0; i < s.args.length; i++) {
                eqs.push([s.args[i], t.args[i]]);
            }
            continue;
        }

        return error('no_rule_applies');
    }

    return ok(sig);
};

export const substOf = (vars: TyVar['value'][], tys: MonoTy[]): TypeSubst => {
    const sig: TypeSubst = {};

    for (let i = 0; i < Math.min(vars.length, tys.length); i++) {
        sig[vars[i]] = tys[i];
    }

    return sig;
};

export const showSubst = (subst: TypeSubst): string => {
    return `{ ${Object.entries(subst).map(([x, ty]) => `${showTyVar(tyVar(parseInt(x)))} : ${showMonoTy(ty)}`).join(', ')} }`;
};