import { showMonoTy, TyConst, TyVar } from "../Inferencer/Types.ts";
import { Pattern } from "../Interpreter/Pattern.ts";
// Declarations are expressions affecting the global environment
import { Expr, LambdaExpr, showExpr } from "./Expr.ts";

export type Decl = FuncDecl | DataTypeDecl;

export type FuncDecl = {
    type: 'fun',
    name: string,
    args: Pattern[],
    body: Expr,
    curried: LambdaExpr
};

export type DataTypeDecl = {
    type: 'datatype',
    typeVars: TyVar[],
    name: string,
    variants: TyConst[]
};

export const showDecl = (decl: Decl): string => {
    switch (decl.type) {
        case 'fun':
            return `${decl.name} ${decl.args.join(' ')} = ${showExpr(decl.body)}`;
        case 'datatype':
            return `data ${decl.name} ${decl.typeVars.map(showMonoTy).join(' ')} = \n` + decl.variants.map(v => '  | ' + showMonoTy(v)).join('\n');
    }
};