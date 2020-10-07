
// Declarations are expressions affecting the global environment
import { Expr, LambdaExpr, showExpr } from "./Expr.ts";

export type Decl = FuncDecl;

export type FuncDecl = {
    type: 'fun',
    name: string,
    args: string[],
    body: Expr,
    curried: LambdaExpr
};

export const showDecl = (decl: Decl): string => {
    switch (decl.type) {
        case 'fun':
            return `${decl.name} ${decl.args.join(' ')} = ${showExpr(decl.body)}`;
    }
};