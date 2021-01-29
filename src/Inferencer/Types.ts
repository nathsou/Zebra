import { defined, sameElems } from "../Utils/Common.ts";
import { Env } from "../Utils/Env.ts";
import { Result } from "../Utils/Result.ts";
import { nextTyVarId } from "./Context.ts";
import { freeVarsEnv, freeVarsMonoTy, substituteMono, substOf } from "./Unification.ts";

// the type of monomorphic types
export type MonoTy = TyVar | TyConst;

// type variables are represented by integers
// export type TyVar = number;
export type TyVar = { value: number, context: string[] };

export type TyConst = {
    name: string,
    args: MonoTy[]
};

export type TyClass = {
    name: string,
    tyVars: TyVar['value'][]
};

// constructors
export const tyVar = (n: number, context: string[] = []): TyVar => ({ value: n, context });
export const tyConst = (name: string, ...args: MonoTy[]): TyConst => ({ name, args });

// a polymorphic type is a monomorphic type
// with universally quantified type variables
export type PolyTy = {
    polyVars: TyVar['value'][],
    ty: MonoTy
};

export const typeVarNamer = () => {
    const memo = new Map<string, TyVar>();

    return {
        name: (name: string): TyVar => {
            if (!memo.has(name)) {
                memo.set(name, tyVar(nextTyVarId()));
            }

            return defined(memo.get(name));
        },
        reset: (): void => {
            memo.clear();
        }
    };
};

export function polyTy(ty: MonoTy, ...polyVars: TyVar[]): PolyTy;
export function polyTy(ty: MonoTy, ...polyVars: TyVar['value'][]): PolyTy;
export function polyTy(ty: MonoTy, ...polyVars: any[]): PolyTy {
    return {
        ty,
        polyVars: polyVars.map(v => typeof v === 'number' ? v : v.value)
    };
}

export function isTyVar(x: MonoTy): x is TyVar {
    return (x as any)['context'] !== undefined;
}

export function isTyConst(x: MonoTy): x is TyConst {
    return (x as any)['args'] !== undefined;
}

export const freshTyVar = (): TyVar => {
    return tyVar(nextTyVarId());
};

/**
 * creates a fresh instance of a polymorphic type
* i.e associates new type names to every polymorphic variable
 */
export const freshInstance = (
    { polyVars, ty }: PolyTy
): Result<MonoTy, string> => {
    const freshTypes = polyVars.map(freshTyVar);
    return substituteMono(ty, substOf(polyVars, freshTypes));
};

/**
 * generalizes a monomorphic type with respect to a typing environment
 * to a polymorphic type where all the variables that do not occur (free)
 * in the range of the environment are universally quantiﬁed in the
 * polymorphic type created
 */
export const generalizeTy = (env: TypeEnv, ty: MonoTy): PolyTy => {
    const envFreeVars = freeVarsEnv(env);
    const polyVars = [...freeVarsMonoTy(ty)].filter(x => !envFreeVars.has(x));
    return polyTy(ty, ...polyVars);
};

export type TypeEnv = Env<PolyTy>;

export const monoTypesEq = (s: MonoTy, t: MonoTy): boolean => {
    if (isTyConst(s) && isTyConst(t)) {
        return s.name === t.name &&
            s.args.length === t.args.length &&
            s.args.every((a, i) => monoTypesEq(a, t.args[i]));
    }

    if (isTyVar(s) && isTyVar(t)) {
        return s.value === t.value;
    }

    return false;
};

export const isTyOverloaded = (ty: MonoTy): boolean => {
    if (isTyVar(ty)) return ty.context.length > 0;
    return ty.args.some(isTyOverloaded);
};

export const polyTypesEq = (s: PolyTy, t: PolyTy): boolean => {
    return sameElems(s.polyVars, t.polyVars) && monoTypesEq(s.ty, t.ty);
};

export const showMonoTy = (t: MonoTy): string => {
    if (isTyVar(t)) return showTyVar(t);
    return showTyConst(t);
};

export function showTyVar(v: number): string;
export function showTyVar(t: TyVar): string;
export function showTyVar(t: number | TyVar): string {
    const v = typeof t === 'number' ? t : t.value;

    const l = String.fromCharCode(945 + v % 23);

    if (v >= 23) {
        return l + `${Math.floor(v / 23)}`;
    }

    // if (typeof t === 'object' && t.context.length !== 0) {
    //     return `(${t.context.map(k => `${k} ${l}`).join(', ')}) => ${l}`;
    // }

    return l;
}

export const showTyConst = (v: TyConst): string => {
    switch (v.name) {
        case '->': return `${showMonoTy(v.args[0])} -> ${showMonoTy(v.args[1])}`;
        case 'tuple': return `(${v.args.map(showMonoTy).join(', ')})`;
    }

    if (v.args.length === 0) return v.name;

    return `${v.name} ${v.args.map(a => showMonoTy(a)).join(' ')}`;
};

export const showPolyTy = (t: PolyTy): string => {
    if (t.polyVars.length === 0) return showMonoTy(t.ty);
    return `${t.polyVars.map(v => `∀${showTyVar(v)}`)}, ${showMonoTy(t.ty)}`;
};

const collectContext = (
    ty: MonoTy,
    ctx: Map<TyVar['value'], Set<string>> = new Map()
): Map<TyVar['value'], Set<string>> => {
    if (isTyVar(ty)) {
        for (const k of ty.context) {
            if (!ctx.has(ty.value)) {
                ctx.set(ty.value, new Set());
            }

            ctx.get(ty.value)?.add(k);
        }
    } else {
        for (const arg of ty.args) {
            collectContext(arg, ctx);
        }
    }

    return ctx;
};

export const showOverloadedTy = (ty: MonoTy) => {
    const str = showMonoTy(ty);
    const ctx = collectContext(ty);

    if (ctx.size === 0) return str;

    const constraints = [];

    for (const [a, classes] of ctx.entries()) {
        const v = showTyVar(a);
        for (const k of classes) {
            constraints.push(`${k} ${v}`);
        }
    }

    return `(${constraints.join(', ')}) => ${str}`;
};

export const showTypeEnv = (env: TypeEnv): string => {
    return `{ ${Object.entries(env).map(([x, ty]) => `${x} : ${showPolyTy(ty)}`).join(', ')} }`;
};

export const canonicalizeTyVars = (t: MonoTy, renameMap: Map<TyVar['value'], TyVar> = new Map()): MonoTy => {
    if (isTyVar(t)) {
        if (renameMap.has(t.value)) {
            return defined(renameMap.get(t.value));
        } else {
            const n = tyVar(renameMap.size, t.context);
            renameMap.set(t.value, n);
            return n;
        }
    }

    return tyConst(t.name, ...t.args.map(a => canonicalizeTyVars(a, renameMap)));
};

export const expandTy = (ty: MonoTy, acc: string[] = []): string[] => {
    if (isTyVar(ty)) return [...acc, '*'];

    if (ty.name !== '->') {
        acc.push(ty.name);
    }

    for (const arg of ty.args) {
        expandTy(arg, acc);
    }

    return acc;
};