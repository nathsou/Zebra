import { DataTypeDecl, InstanceDecl, TypeClassDecl, TypeDecl } from "../Parser/Decl.ts";
import { CoreExpr } from "./CoreExpr.ts";

export type CoreDecl = CoreFuncDecl | TypeDecl;

export type SingleExprProg = {
    typeDecls: TypeDecl[],
    main: CoreExpr
};

export type CoreFuncDecl = {
    type: 'fun',
    name: string,
    args: string[],
    body: CoreExpr
};

export type PartitionedDecls = ReturnType<typeof partitionDecls>;

export const partitionDecls = (decls: CoreDecl[]) => {
    const funcDecls: CoreFuncDecl[] = [];
    const dataTypeDecls: DataTypeDecl[] = [];
    const typeClassDecls: TypeClassDecl[] = [];
    const instanceDecls: InstanceDecl[] = [];

    for (const d of decls) {
        switch (d.type) {
            case 'fun':
                funcDecls.push(d);
                break;
            case 'datatype':
                dataTypeDecls.push(d);
                break;
            case 'typeclass':
                typeClassDecls.push(d);
                break;
            case 'instance':
                instanceDecls.push(d);
                break;
        }
    }

    return {
        funcDecls,
        dataTypeDecls,
        typeClassDecls,
        instanceDecls
    };
};