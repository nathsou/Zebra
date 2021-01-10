import { DataTypeDecl } from "../Parser/Decl.ts";
import { CoreExpr } from "./CoreExpr.ts";

export type CoreDecl = CoreFuncDecl | DataTypeDecl;

export type SingleExprProg = {
    datatypes: DataTypeDecl[],
    main: CoreExpr
};

export type CoreFuncDecl = {
    type: 'fun',
    name: string,
    args: string[],
    body: CoreExpr
};