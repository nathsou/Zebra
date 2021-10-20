import { CoreFuncDecl } from "../Core/CoreDecl";
import { MonoTy, PolyTy, TyClass, TyConst, TyVar } from "../Inferencer/Types";
import { Pattern } from "../Interpreter/Pattern";
import { Expr, VarExpr } from "./Expr";
export declare type Decl = FuncDecl | ExportDecl | ImportDecl | TypeDecl;
export declare type TypeDecl = DataTypeDecl | TypeClassDecl | InstanceDecl;
export declare type FuncDecl = {
    type: 'fun';
    funName: VarExpr;
    args: Pattern[];
    body: Expr;
};
export declare type DataTypeDecl = {
    type: 'datatype';
    typeVars: TyVar[];
    name: string;
    variants: TyConst[];
};
export declare type TypeClassDecl = {
    type: 'typeclass';
    context: TyClass[];
    name: string;
    tyVar: TyVar['value'];
    methods: Map<string, PolyTy>;
};
export declare type InstanceDecl = {
    type: 'instance';
    context: TyClass[];
    class_: string;
    ty: MonoTy;
    defs: Map<string, [TyVar['value'], CoreFuncDecl]>;
};
export declare type ImportDecl = {
    type: 'import';
    path: string;
    imports: string[];
};
export declare type ExportDecl = {
    type: 'export';
    exports: string[];
};
export declare const showContext: (ctx: TyClass[]) => string;
export declare const showDecl: (decl: Decl) => string;
