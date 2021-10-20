import { MonoTy } from "../Inferencer/Types";
import { DataTypeDecl } from "../Parser/Decl";
import { Program } from "../Parser/Program";
import { CoreFuncDecl } from "./CoreDecl";
import { CoreExpr } from "./CoreExpr";
declare type VarEnv = {
    [key: string]: true;
};
declare type Graph<T> = Map<T, Set<T>>;
export declare type Dependencies = Graph<string>;
export declare const renameTyClassInstance: (method: string, ty: MonoTy, class_: string) => string;
export declare const singleExprProgOf: (prog: Program, includeUnusedDependencies?: boolean) => CoreExpr;
export declare const varEnvOf: (...xs: string[]) => VarEnv;
export declare const usedFuncDecls: (f: string, deps: Graph<string>, used?: Set<string>) => Set<string>;
export declare const reorderFunDecls: (f: string, deps: Graph<string>, order?: Set<string>) => Set<string>;
export declare const funcDeclsDependencies: (funDecls: Iterable<CoreFuncDecl>, dataTypeDecls: Iterable<DataTypeDecl>) => Graph<string>;
export declare const coreFunDeclFreeVars: (f: CoreFuncDecl, env: VarEnv) => Set<string>;
export declare const coreExprFreeVars: (e: CoreExpr, env?: VarEnv, freeVars?: Set<string>) => Set<string>;
export {};
