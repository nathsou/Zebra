import { showMonoTy, showTyConst } from "../../Inferencer/Types.ts";
import { DataTypeDecl } from "../../Parser/Decl.ts";
import { showPrim } from "./PrimitiveCompiler.ts";
import { PrimExpr, PrimLambdaExpr } from "./PrimitiveExpr.ts";

export type PrimDecl = PrimFuncDecl | DataTypeDecl;

export type PrimFuncDecl = {
    type: 'fun',
    name: string,
    args: string[],
    body: PrimExpr,
    curried: PrimLambdaExpr
};

export const showPrimDecl = (d: PrimDecl): string => {
    switch (d.type) {
        case 'fun':
            return `${d.name} ${d.args.join(' ')} = ${showPrim(d.body)}`;
        case 'datatype':
            return `data ${d.name} ${d.typeVars.map(showMonoTy).join(' ')} = ${d.variants.map(showTyConst).join(' | ')}`;
    }
};