import { CoreExpr } from "../Core/CoreExpr";
import { InstanceDecl } from "../Parser/Decl";
import { Program } from "../Parser/Program";
import { Result } from "../Utils/Result";
import { MethodName } from "./Context";
import { MonoTy, TypeEnv } from "./Types";
import { TypeSubst } from "./Unification";
export declare type TypeError = string;
export declare type TypeCheckerResult = Result<[MonoTy, TypeSubst], TypeError>;
/**
 * infers the most general monomorphic type of an expression
 * @returns an error if type checking failed
 */
export declare const inferExprType: (expr: CoreExpr, env?: TypeEnv) => TypeCheckerResult;
export declare const registerTypeDecls: (prog: Program) => void;
export declare const instanceMethodsTypes: (inst: InstanceDecl) => Result<Map<MethodName, MonoTy>, string>;
export declare const typeCheckInstances: (instances: InstanceDecl[]) => Result<TypeSubst, string>;
