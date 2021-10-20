import { TyConstVal as ValTyConst } from "../Interpreter/Value";
import { ConstantExpr } from "../Parser/Expr";
import { Maybe } from "../Utils/Maybe";
import { MonoTy, PolyTy } from "./Types";
export declare const intTy: import("./Types").TyConst;
export declare const floatTy: import("./Types").TyConst;
export declare const boolTy: import("./Types").TyConst;
export declare const charTy: import("./Types").TyConst;
export declare const unitTy: import("./Types").TyConst;
export declare const stringTy: import("./Types").TyConst;
export declare function funTy(...ts: MonoTy[]): MonoTy;
/**
 * retrieves the return type of a function type
 * i.e. the rightmost type in a -> b -> ... -> ret
 */
export declare const funReturnTy: (f: MonoTy) => MonoTy;
export declare const uncurryFun: (f: MonoTy) => MonoTy[];
export declare const tyConstTy: (t: ValTyConst) => import("./Types").TyConst;
export declare const tupleTy: (n: number) => PolyTy;
export declare const constantTy: (c: ConstantExpr) => PolyTy;
export declare const binopTy: (op: string) => Maybe<PolyTy>;
