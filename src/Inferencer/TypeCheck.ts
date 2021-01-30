import { CoreDecl, CoreFuncDecl } from "../Core/CoreDecl.ts";
import { CoreExpr, CoreLetInExpr } from "../Core/CoreExpr.ts";
import { funcDeclsDependencies, singleExprProgOf, usedFuncDecls } from "../Core/ExprOfFunDecls.ts";
import { VarExpr, varOf } from "../Parser/Expr.ts";
import { Program } from "../Parser/Program.ts";
import { defined, find } from "../Utils/Common.ts";
import { isNone } from "../Utils/Maybe.ts";
import { bind, error, ok, Result } from "../Utils/Result.ts";
import { clearContext } from "./Context.ts";
import { inferExprType, registerTypeDecls, typeCheckInstances } from "./Inferencer.ts";
import { monomorphizeProg } from "./Monomorphize.ts";
import { primitiveEnv } from "./Primitives.ts";
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

export const typeCheck = (prog: Program): Result<{
    ty: MonoTy,
    main: CoreFuncDecl,
    coreProg: CoreDecl[],
    sig: TypeSubst
}, string> => {
    const main = prog.getCoreFuncDecl('main');

    if (isNone(main)) {
        return error(`main function not found`);
    }

    const singleExprProg = singleExprProgOf(prog, true);

    // clear the global context
    clearContext();

    // initialize the context
    registerTypeDecls(prog);

    const gamma = primitiveEnv();

    return bind(inferExprType(wrapMain(singleExprProg, main.funName), gamma), ([ty, sig1]) => {
        return bind(typeCheckInstances(prog.instances), sig2 => {
            return bind(substCompose(sig1, sig2), sig12 => {

                // console.log(
                //     [...context.identifiers.entries()]
                //         // .filter(([k, [f, ty]]) => showPolyTy(okOrThrow(substitutePoly(ty, sig12))).includes('μ14'))
                //         .filter(([k, [f, ty]]) => f.includes('boolBinOp'))
                //         // .map(([k, [f, ty]]) => `${f} ${k}: ${showPolyTy(ty)}`)
                //         .map(([k, [f, ty]]) => `${f} ${k}: ${showPolyTy(okOrThrow(substitutePoly(ty, sig1)))}`)
                //         .join('\n')
                // );

                return bind(monomorphizeProg(prog, sig12), mono => {
                    const deps = funcDeclsDependencies(mono, prog.datatypes.values());
                    const reorderd = reorderFuncs(mono, [...usedFuncDecls('main', deps)].reverse());

                    return ok({
                        ty: canonicalizeTyVars(ty),
                        main: defined(find(mono, f => f.funName.name === 'main')),
                        coreProg: [...prog.datatypes.values(), ...reorderd],
                        singleExprProg,
                        sig: sig12
                    });
                });
            });
        });
    });
};