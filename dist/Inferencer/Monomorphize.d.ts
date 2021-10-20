import { CoreFuncDecl } from "../Core/CoreDecl";
import { TypeSubst } from "../Inferencer/Unification";
import { Program } from "../Parser/Program";
import { Result } from "../Utils/Result";
export declare const monomorphizeProg: (prog: Program, sig: TypeSubst) => Result<CoreFuncDecl[], string>;
