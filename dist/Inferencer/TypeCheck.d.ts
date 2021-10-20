import { CoreDecl, CoreFuncDecl } from "../Core/CoreDecl";
import { Program } from "../Parser/Program";
import { Result } from "../Utils/Result";
import { MonoTy } from "./Types";
import { TypeSubst } from "./Unification";
export declare const typeCheck: (prog: Program) => Result<{
    ty: MonoTy;
    main: CoreFuncDecl;
    coreProg: CoreDecl[];
    sig: TypeSubst;
}, string>;
