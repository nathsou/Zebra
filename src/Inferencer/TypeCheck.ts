import { casifyFunctionDeclarations } from "../Core/Casify.ts";
import { CoreDecl, CoreFuncDecl, partitionDecls, SingleExprProg } from "../Core/CoreDecl.ts";
import { singleExprProgOf } from "../Core/ExprOfFunDecls.ts";
import { Decl } from "../Parser/Decl.ts";
import { find } from "../Utils/Common.ts";
import { isNone, Maybe } from "../Utils/Maybe.ts";
import { bind, error, ok, Result } from "../Utils/Result.ts";
import { inferExprType, registerTypeDecls, typeCheckInstances } from "./Inferencer.ts";
import { canonicalizeTyVars, MonoTy } from "./Types.ts";

export const typeCheck = (prog: Decl[]): Result<{
    ty: MonoTy,
    main: CoreFuncDecl,
    coreProg: CoreDecl[],
    singleExprProg: SingleExprProg
}, string> => {
    const coreProg = casifyFunctionDeclarations(prog);

    const main = find(
        coreProg,
        f => f.type === 'fun' && f.name === 'main'
    ) as Maybe<CoreFuncDecl>;

    if (isNone(main)) {
        return error(`main function not found`);
    }

    const decls = partitionDecls(coreProg);
    const singleExprProg = singleExprProgOf(decls, true);

    // console.log(showExpr(singleExprProg.main));

    const gamma = registerTypeDecls(singleExprProg.typeDecls);

    return bind(inferExprType(singleExprProg.main, gamma), ([ty, gamma2]) => {
        return bind(typeCheckInstances(decls.instanceDecls, gamma2), () => {
            return ok({ ty: canonicalizeTyVars(ty), main, coreProg, singleExprProg });
        });
    });
};