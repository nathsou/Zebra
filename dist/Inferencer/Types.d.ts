import { Env } from "../Utils/Env";
import { Result } from "../Utils/Result";
export declare type MonoTy = TyVar | TyConst;
export declare type TyVar = {
    value: number;
    context: string[];
};
export declare type TyConst = {
    name: string;
    args: MonoTy[];
};
export declare type TyClass = {
    name: string;
    tyVars: TyVar['value'][];
};
export declare const tyVar: (n: number, context?: string[]) => TyVar;
export declare const tyConst: (name: string, ...args: MonoTy[]) => TyConst;
export declare type PolyTy = {
    polyVars: TyVar['value'][];
    ty: MonoTy;
};
export declare const typeVarNamer: () => {
    name: (name: string) => TyVar;
    reset: () => void;
};
export declare function polyTy(ty: MonoTy, ...polyVars: TyVar[]): PolyTy;
export declare function polyTy(ty: MonoTy, ...polyVars: TyVar['value'][]): PolyTy;
export declare function isTyVar(x: MonoTy): x is TyVar;
export declare function isTyConst(x: MonoTy): x is TyConst;
export declare const freshTyVar: () => TyVar;
/**
 * creates a fresh instance of a polymorphic type
* i.e associates new type names to every polymorphic variable
 */
export declare const freshInstance: ({ polyVars, ty }: PolyTy) => Result<MonoTy, string>;
/**
 * generalizes a monomorphic type with respect to a typing environment
 * to a polymorphic type where all the variables that do not occur (free)
 * in the range of the environment are universally quantiﬁed in the
 * polymorphic type created
 */
export declare const generalizeTy: (env: TypeEnv, ty: MonoTy) => PolyTy;
export declare type TypeEnv = Env<PolyTy>;
export declare const monoTypesEq: (s: MonoTy, t: MonoTy) => boolean;
export declare const isTyOverloaded: (ty: MonoTy) => boolean;
export declare const polyTypesEq: (s: PolyTy, t: PolyTy) => boolean;
export declare const showMonoTy: (t: MonoTy) => string;
export declare function showTyVar(v: number): string;
export declare function showTyVar(t: TyVar): string;
export declare const showTyConst: (v: TyConst) => string;
export declare const showPolyTy: (t: PolyTy) => string;
export declare const showOverloadedTy: (ty: MonoTy) => string;
export declare const showTypeEnv: (env: TypeEnv) => string;
export declare const canonicalizeTyVars: (t: MonoTy, renameMap?: Map<TyVar['value'], TyVar>) => MonoTy;
export declare const expandTy: (ty: MonoTy, acc?: string[]) => string[];
