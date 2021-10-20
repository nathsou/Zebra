import { PrimExpr } from "./PrimitiveExpr";
export declare type PrimDecl = PrimFuncDecl;
export declare type PrimFuncDecl = {
    type: 'fun';
    name: string;
    args: string[];
    body: PrimExpr;
};
export declare const showPrimDecl: (d: PrimDecl) => string;
