import { showPrim } from "./PrimitiveCompiler";
import { PrimExpr } from "./PrimitiveExpr";

export type PrimDecl = PrimFuncDecl;

export type PrimFuncDecl = {
    type: 'fun',
    name: string,
    args: string[],
    body: PrimExpr
};

export const showPrimDecl = (d: PrimDecl): string => {
    switch (d.type) {
        case 'fun':
            return `${d.name} ${d.args.join(' ')} = ${showPrim(d.body)}`;
    }
};