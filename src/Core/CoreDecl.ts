import { canonicalizeTyVars, showMonoTy, showTyVar } from "../Inferencer/Types.ts";
import { DataTypeDecl, Decl, InstanceDecl, TypeClassDecl, TypeDecl } from "../Parser/Decl.ts";
import { CoreExpr, CoreVarExpr, exprOfCore, showCoreExpr } from "./CoreExpr.ts";
import { showContext } from "../Parser/Decl.ts";
import { patVarOfVar } from "../Interpreter/Pattern.ts";

export type CoreDecl = CoreFuncDecl | TypeDecl;

export type CoreFuncDecl = {
    type: 'fun',
    funName: CoreVarExpr,
    args: CoreVarExpr[],
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

export const showCoreDecl = (decl: CoreDecl): string => {
    switch (decl.type) {
        case 'fun':
            return `${decl.funName.name} ${decl.args.map(v => v.name).join(' ')} = ${showCoreExpr(decl.body)}`;
        case 'datatype':
            return `data ${decl.name} ${decl.typeVars.map(showMonoTy).join(' ')} = \n` + decl.variants.map(v => '  | ' + showMonoTy(v)).join('\n');
        case 'typeclass':
            return `class${showContext(decl.context)} ${decl.name} ${showTyVar(decl.tyVar)} where\n` +
                [...decl.methods.entries()].map(([name, { ty }]) => `   ${name} : ${showMonoTy(canonicalizeTyVars(ty))}`).join('\n');
        case 'instance':
            return `instance${showContext(decl.context)} ${decl.class_} ${showMonoTy(canonicalizeTyVars(decl.ty))} where\n`
                + [...decl.defs.values()].map(([_, d]) => `    ${showCoreDecl(d)}`).join('\n');
    }
};

export const declOfCore = (d: CoreDecl): Decl => {
    switch (d.type) {
        case 'fun':
            return {
                type: 'fun',
                funName: d.funName,
                args: d.args.map(patVarOfVar),
                body: exprOfCore(d.body)
            };
        case 'datatype':
        case 'instance':
        case 'typeclass':
            return d;
    }
};