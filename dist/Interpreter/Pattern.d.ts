import { MonoTy, PolyTy, TypeEnv } from "../Inferencer/Types";
import { TypeSubst } from "../Inferencer/Unification";
import { VarExpr } from "../Parser/Expr";
import { Maybe } from "../Utils/Maybe";
import { Result } from "../Utils/Result";
import { Value } from "./Value";
export declare type Pattern = Var | Fun;
export declare type Var = {
    value: string;
    id: number;
};
export declare type Fun = {
    name: string;
    args: Pattern[];
};
export declare type ValSubst = {
    [x: string]: Value;
};
export declare const patVarOf: (name: string) => {
    value: string;
    id: number;
};
export declare const patVarOfVar: (v: VarExpr) => Var;
export declare const varOfPatVar: (v: Var) => VarExpr;
export declare function isVar(x: Pattern): x is Var;
export declare function isFun(f: Pattern): f is Fun;
export declare const vars: (p: Pattern, acc?: Set<Var>) => Set<Var>;
export declare const unifyPattern: (p: Pattern, v: Value) => Maybe<ValSubst>;
export declare const checkedUnify: (s: MonoTy, t: MonoTy, p: Pattern) => Result<TypeSubst, string>;
export declare const collectPatternSubst: (env: TypeEnv, p: Pattern, tau: MonoTy, vars: Record<string, PolyTy>) => Result<TypeSubst, string>;
export declare const showPattern: (p: Pattern) => string;
