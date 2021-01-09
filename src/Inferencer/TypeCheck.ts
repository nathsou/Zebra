import { CoreDecl, CoreFuncDecl } from "../Core/CoreDecl.ts";
import { casifyFunctionDeclarations } from "../Core/Casify.ts";
import { Decl } from "../Parser/Decl.ts";
import { isNone, Maybe } from "../Utils/Mabye.ts";
import { bind, error, ok, Result } from "../Utils/Result.ts";
import { inferExprType, registerDataTypes } from "./Inferencer.ts";
import { canonicalizeTyVars, MonoTy } from "./Types.ts";
import { exprOfFunDelcs } from "../Core/ExprOfFunDecls.ts";

export const typeCheck = (prog: Decl[]): Result<{
    ty: MonoTy, main: CoreFuncDecl, coreProg: CoreDecl[]
}, string> => {
    const coreProg = casifyFunctionDeclarations(prog);
    const main = coreProg
        .find(f => f.type === 'fun' && f.name === 'main') as Maybe<CoreFuncDecl>;

    if (isNone(main)) {
        return error(`main function not found`);
    }

    const mainExpr = exprOfFunDelcs(coreProg);
    const gamma = registerDataTypes(coreProg);

    return bind(inferExprType(mainExpr, gamma), ty => {
        return ok({ ty: canonicalizeTyVars(ty), main, coreProg });
    });
};