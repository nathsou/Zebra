import { DecisionTree } from "../DecisionTrees/DecisionTree";
export declare type PrimExpr = PrimAtomicExpr | PrimAppExpr | PrimIfThenElseExpr | PrimSwitchExpr | PrimLambdaExpr | PrimLetInExpr | PrimLetRecInExpr | PrimSubtermOccurence;
export declare type PrimLambdaExpr = {
    type: 'lambda';
    arg: string;
    body: PrimExpr;
};
export declare type PrimLetInExpr = {
    type: 'let_in';
    left: string;
    middle: PrimExpr;
    right: PrimExpr;
};
export declare type PrimLetRecInExpr = {
    type: 'let_rec_in';
    funName: string;
    arg: string;
    middle: PrimExpr;
    right: PrimExpr;
};
export declare type PrimSwitchExpr = {
    type: 'switch';
    value: PrimExpr;
    dt: DecisionTree;
};
export declare type PrimVarExpr = {
    type: 'variable';
    name: string;
};
export declare type PrimTyConstExpr = {
    type: 'tyconst';
    name: string;
    args: PrimExpr[];
};
export declare type PrimConstantExpr = PrimIntegerExpr | PrimFloatExpr | PrimCharExpr;
export declare type PrimIntegerExpr = {
    type: 'constant';
    kind: 'integer';
    value: number;
};
export declare type PrimFloatExpr = {
    type: 'constant';
    kind: 'float';
    value: number;
};
export declare type PrimCharExpr = {
    type: 'constant';
    kind: 'char';
    value: string;
};
export declare type PrimIfThenElseExpr = {
    type: 'if_then_else';
    cond: PrimExpr;
    thenBranch: PrimExpr;
    elseBranch: PrimExpr;
};
export declare type PrimAppExpr = {
    type: 'app';
    lhs: PrimExpr;
    rhs: PrimExpr;
};
export declare type PrimAtomicExpr = PrimConstantExpr | PrimVarExpr | PrimTyConstExpr;
export declare type PrimSubtermOccurence = {
    type: 'subterm';
    index: number;
    pos: number[];
};
