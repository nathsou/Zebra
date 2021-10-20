import { FuncDecl } from "../Parser/Decl";
import { Expr } from "../Parser/Expr";
import { CoreFuncDecl } from "./CoreDecl";
import { CoreExpr } from "./CoreExpr";
export declare const casifyFunctionDeclarations: (funcs: Map<string, FuncDecl[]>) => Map<string, CoreFuncDecl>;
export declare const reducePatternMatchingToCaseOf: (fun: FuncDecl) => CoreFuncDecl;
/**
 * reduces pattern matching variants of let in, lambda, let rec in expression
 * to core expressions using case of
 */
export declare const coreOf: (e: Expr) => CoreExpr;
export declare const casify: (name: string, funs: FuncDecl[]) => FuncDecl;
export declare const groupByHead: (funs: FuncDecl[]) => Map<string, FuncDecl[]>;
