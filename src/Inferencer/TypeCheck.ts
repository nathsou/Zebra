import { casifyFunctionDeclarations } from "../Core/Casify.ts";
import { CoreDecl, CoreFuncDecl, partitionDecls, PartitionedDecls } from "../Core/CoreDecl.ts";
import { CoreExpr, CoreLetInExpr } from "../Core/CoreExpr.ts";
import { funcDeclsDependencies, singleExprProgOf, usedFuncDecls } from "../Core/ExprOfFunDecls.ts";
import { monomorphizeProg } from "../Core/Monomorphize.ts";
import { Decl } from "../Parser/Decl.ts";
import { VarExpr, varOf } from "../Parser/Expr.ts";
import { defined, find } from "../Utils/Common.ts";
import { isNone, Maybe } from "../Utils/Maybe.ts";
import { bind, error, ok, Result } from "../Utils/Result.ts";
import { clearContext } from "./Context.ts";
import { inferExprType, registerTypeDecls, typeCheckInstances } from "./Inferencer.ts";
import { canonicalizeTyVars, MonoTy } from "./Types.ts";
import { substCompose, TypeSubst } from "./Unification.ts";

const wrapMain = (main: CoreExpr, name: VarExpr): CoreLetInExpr => {
    return {
        type: 'let_in',
        left: name,
        middle: main,
        right: varOf('main')
    };
};

const reorderFuncs = (funcs: CoreFuncDecl[], order: string[]): CoreFuncDecl[] => {
    const funcsByName = new Map(funcs.map(d => [d.funName.name, d]));
    const reordered = order
        .filter(f => funcsByName.has(f))
        .map(f => defined(funcsByName.get(f)));

    return reordered;
};

export const typeCheck = (prog: Decl[]): Result<{
    ty: MonoTy,
    main: CoreFuncDecl,
    coreProg: CoreDecl[],
    decls: PartitionedDecls,
    sig: TypeSubst
}, string> => {
    const coreProg = casifyFunctionDeclarations(prog);

    const main = find(
        coreProg,
        f => f.type === 'fun' && f.funName.name === 'main'
    ) as Maybe<CoreFuncDecl>;

    if (isNone(main)) {
        return error(`main function not found`);
    }

    const decls = partitionDecls(coreProg);
    const typeDecls = [
        ...decls.dataTypeDecls,
        ...decls.typeClassDecls,
        ...decls.instanceDecls
    ];

    const singleExprProg = singleExprProgOf(decls, true);

    // clear the global context
    clearContext();

    // initialize the context
    registerTypeDecls(typeDecls);

    return bind(inferExprType(wrapMain(singleExprProg, main.funName)), ([ty, sig1]) => {
        return bind(typeCheckInstances(decls.instanceDecls), sig2 => {
            return bind(substCompose(sig1, sig2), sig12 => {
                return bind(monomorphizeProg(coreProg, sig12), mono => {
                    const deps = funcDeclsDependencies(mono, decls.dataTypeDecls);
                    const reorderd = reorderFuncs(mono, [...usedFuncDecls('main', deps)].reverse());

                    return ok({
                        ty: canonicalizeTyVars(ty),
                        main: defined(find(mono, f => f.funName.name === 'main')),
                        coreProg: [...decls.dataTypeDecls, ...reorderd],
                        singleExprProg,
                        decls,
                        sig: sig12
                    });
                });
            });
        });
    });
};