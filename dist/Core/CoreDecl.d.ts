import { Decl, TypeDecl } from "../Parser/Decl";
import { CoreExpr, CoreVarExpr } from "./CoreExpr";
export declare type CoreDecl = CoreFuncDecl | TypeDecl;
export declare type CoreFuncDecl = {
    type: 'fun';
    funName: CoreVarExpr;
    args: CoreVarExpr[];
    body: CoreExpr;
};
export declare const showCoreDecl: (decl: CoreDecl) => string;
export declare const declOfCore: (d: CoreDecl) => Decl;
