import { CoreCaseOfExpr } from "../../Core/CoreExpr";
import { Pattern } from "../../Interpreter/Pattern";
import { Value } from "../../Interpreter/Value";
import { Dict } from "../../Utils/Common";
import { PrimExpr, PrimSubtermOccurence } from "../Primitive/PrimitiveExpr";
import { DecisionTree } from "./DecisionTree";
export declare type AnyPat = '_';
export declare const anyPat: AnyPat;
export declare type DTFunPattern = {
    name: string;
    args: DTPattern[];
};
export declare type DTPattern = DTFunPattern | AnyPat;
declare type ClauseMatrixRow = DTPattern[];
export declare type ClauseMatrix = {
    dims: [number, number];
    patterns: ClauseMatrixRow[];
    actions: {
        bindings: Dict<PrimSubtermOccurence>;
        action: PrimExpr;
    }[];
};
export declare const dtPatternOf: (p: Pattern) => DTPattern;
export declare const subtermsOccurences: (p: Pattern, sigma?: Dict<PrimSubtermOccurence>, subTermIndex?: number) => Dict<PrimSubtermOccurence>;
export declare const collectBindings: (p: Pattern, sigma: Dict<PrimSubtermOccurence>, localOffset: number | undefined, parent: PrimSubtermOccurence) => void;
export declare const clauseMatrixOf: (expr: CoreCaseOfExpr) => ClauseMatrix;
export declare const specializeClauseMatrix: (matrix: ClauseMatrix, ctor: string, arity: number) => ClauseMatrix;
export declare const defaultClauseMatrix: (matrix: ClauseMatrix) => ClauseMatrix;
export declare type Occcurence = {
    value: Value;
    pos: number[];
};
export declare type IndexedOccurence = {
    index: number;
    pos: number[];
};
export declare const compileClauseMatrix: (argsCount: number, matrix: ClauseMatrix, signature: Set<string>) => DecisionTree;
export {};
