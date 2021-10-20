import { CoreDecl } from "../Core/CoreDecl";
import { MonoTy } from "../Inferencer/Types";
import { Program } from "../Parser/Program";
import { Result } from "../Utils/Result";
import { ValEnv, Value } from "./Value";
declare type EvalError = string;
export declare const registerDecl: (decls: CoreDecl[]) => Result<ValEnv, EvalError>;
export declare const interpret: (prog: Program) => Result<[value: Value, type: MonoTy], string>;
export {};
