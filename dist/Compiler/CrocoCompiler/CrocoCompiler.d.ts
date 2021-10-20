import { Pattern } from "../../Interpreter/Pattern";
import { Decl } from "../../Parser/Decl";
import { Expr } from "../../Parser/Expr";
export declare const crocoProgramOf: (prog: Decl[]) => string;
export declare const crocoDeclOf: (decl: Decl, topLevelFuncs: string[], funcNames: Set<string>) => string;
export declare const crocoPatternOf: (pattern: Pattern) => string;
export declare const crocoExprOf: (expr: Expr, topLevelFuncs: string[], funcNames: Set<string>) => string;
