import { canonicalizeTyVars, MonoTy, PolyTy, showMonoTy, showTyVar, TyClass, TyConst, TyVar } from "../Inferencer/Types.ts";
import { Pattern, showPattern } from "../Interpreter/Pattern.ts";

// Declarations are expressions affecting the global environment
import { Expr, showExpr } from "./Expr.ts";

export type Decl = FuncDecl | TypeDecl;

export type TypeDecl = DataTypeDecl | TypeClassDecl | InstanceDecl;

export type FuncDecl = {
    type: 'fun',
    name: string,
    args: Pattern[],
    body: Expr
};

export type DataTypeDecl = {
    type: 'datatype',
    typeVars: TyVar[],
    name: string,
    variants: TyConst[]
};

export type TypeClassDecl = {
    type: 'typeclass',
    context: TyClass[],
    name: string,
    tyVar: TyVar['value'],
    methods: Map<string, PolyTy>
};

export type InstanceDecl = {
    type: 'instance',
    context: TyClass[],
    name: string,
    ty: TyConst,
    defs: Map<string, FuncDecl>
};

const showContext = (ctx: TyClass[]): string => {
    if (ctx.length === 0) return '';
    return ` (${ctx.map(c => `${c.name} ${c.tyVars.map(showTyVar).join(' ')}`).join(', ')}) => `;
};

export const showDecl = (decl: Decl): string => {
    switch (decl.type) {
        case 'fun':
            return `${decl.name} ${decl.args.map(showPattern).join(' ')} = ${showExpr(decl.body)}`;
        case 'datatype':
            return `data ${decl.name} ${decl.typeVars.map(showMonoTy).join(' ')} = \n` + decl.variants.map(v => '  | ' + showMonoTy(v)).join('\n');
        case 'typeclass':
            return `class${showContext(decl.context)} ${decl.name} ${showTyVar(decl.tyVar)} where\n` +
                [...decl.methods.entries()].map(([name, { ty }]) => `   ${name} : ${showMonoTy(canonicalizeTyVars(ty))}`).join('\n');
        case 'instance':
            return `instance${showContext(decl.context)} ${decl.name} ${showMonoTy(canonicalizeTyVars(decl.ty))} where\n`
                + [...decl.defs.values()].map(d => `    ${showDecl(d)}`).join('\n');
    }
};