import { freeVarsEnv, freeVarsMonoTy, substituteMono, substOf } from "./Unification.ts";

// the type of monomortphic types
export type MonoTy = TyVar | TyConst;

// type variables are represented by integers
export type TyVar = number;

export type TyConst = {
    name: string,
    args: MonoTy[]
};

// constructors
export const tyVar = (n: number): TyVar => n;
export const tyConst = (name: string, ...args: MonoTy[]): TyConst => ({ name, args });

// a polymorphic type is a monomorphic type
// with universally quantified type variables
export type PolyTy = {
    polyVars: TyVar[],
    ty: MonoTy
};

export const typeVarNamer = () => {
    const memo = new Map<string, TyVar>();

    return (name: string): TyVar => {
        if (!memo.has(name)) {
            memo.set(name, memo.size);
        }

        return memo.get(name) as TyVar;
    };
};

export const polyTy = (ty: MonoTy, ...polyVars: TyVar[]): PolyTy => ({ polyVars, ty });

export function isTyVar(x: MonoTy): x is TyVar {
    return typeof x === 'number';
}

export function isTyConst(x: MonoTy): x is TyConst {
    return typeof x === 'object';
}

let freshTyVarIndex = 0;

export const freshTyVar = (): TyVar => {
    return freshTyVarIndex++;
};

export const resetTyVars = (): void => {
    freshTyVarIndex = 0;
};

/**
 * creates a fresh instance of a polymorphic type
* i.e associates new type names to every polymorphic variable
 */
export const freshInstance = ({ polyVars, ty }: PolyTy): MonoTy => {
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
    const polyVars = [...freeVarsMonoTy(ty)].filter(x => envFreeVars.has(x));
    return polyTy(ty, ...polyVars);
};

export type TypeEnv = { [x: string]: PolyTy };

export const monoTypesEq = (s: MonoTy, t: MonoTy): boolean => {
    if (isTyConst(s) && isTyConst(t)) {
        return s.name === t.name &&
            s.args.length === t.args.length &&
            s.args.every((a, i) => monoTypesEq(a, t.args[i]));
    }

    return s === t;
};


const sameElems = <T>(a: T[], b: T[]): boolean => {
    if (a.length !== b.length) return false;

    const aSet = new Set(a);
    const bSet = new Set(b);

    for (const s of aSet) {
        if (!bSet.has(s)) return false;
    }

    return true;
};

export const polyTypesEq = (s: PolyTy, t: PolyTy): boolean => {
    return sameElems(s.polyVars, t.polyVars) && monoTypesEq(s.ty, t.ty);
};

export const showMonoTy = (t: MonoTy): string => {
    if (isTyVar(t)) return showTyVar(t);
    return showTyConst(t);
};

export const showTyVar = (v: TyVar): string => {
    const l = String.fromCharCode(945 + v % 23);

    if (v > 23) {
        return l + `${Math.floor(v / 23)}`;
    }

    return l;
};

export const showTyConst = (v: TyConst): string => {
    switch (v.name) {
        case '->': return `${showMonoTy(v.args[0])} -> ${showMonoTy(v.args[1])}`;
    }

    if (v.args.length === 0) return v.name;

    return `(${v.name} ${v.args.map(a => showMonoTy(a)).join(' ')})`;
};

export const showPolyTy = (t: PolyTy): string => {
    if (t.polyVars.length === 0) return showMonoTy(t.ty);
    return `${t.polyVars.map(v => `∀${showTyVar(v)}`)}, ${showMonoTy(t.ty)}`;
};

export const showTypeEnv = (env: TypeEnv): string => {
    return `{ ${Object.entries(env).map(([x, ty]) => `${x} : ${showPolyTy(ty)}`).join(', ')} }`;
};