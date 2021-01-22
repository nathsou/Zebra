import { DecisionTree } from "../DecisionTrees/DecisionTree.ts";

// CoreExpr where CaseOfExpr is replaced by SwitchExpr
export type PrimExpr = PrimAtomicExpr | PrimAppExpr | PrimIfThenElseExpr | PrimBinopExpr
    | PrimSwitchExpr | PrimLambdaExpr | PrimLetInExpr | PrimLetRecInExpr | PrimSubtermOccurence;

export type PrimLambdaExpr = {
    type: 'lambda',
    arg: string,
    body: PrimExpr
};

export type PrimLetInExpr = {
    type: 'let_in',
    left: string,
    middle: PrimExpr,
    right: PrimExpr
};

export type PrimLetRecInExpr = {
    type: 'let_rec_in',
    funName: string,
    arg: string,
    middle: PrimExpr,
    right: PrimExpr
};

export type PrimSwitchExpr = {
    type: 'switch',
    value: PrimExpr,
    dt: DecisionTree
};

export type PrimVarExpr = {
    type: 'variable',
    name: string
};

export type PrimTyConstExpr = {
    type: 'tyconst',
    name: string,
    args: PrimExpr[]
};

export type PrimConstantExpr = PrimIntegerExpr | PrimFloatExpr | PrimCharExpr;

export type PrimIntegerExpr = {
    type: 'constant',
    kind: 'integer',
    value: number
};

export type PrimFloatExpr = {
    type: 'constant',
    kind: 'float',
    value: number
};

export type PrimCharExpr = {
    type: 'constant',
    kind: 'char',
    value: string
};

export type PrimIfThenElseExpr = {
    type: 'if_then_else',
    cond: PrimExpr,
    thenBranch: PrimExpr,
    elseBranch: PrimExpr
};

export type PrimAppExpr = {
    type: 'app',
    lhs: PrimExpr,
    rhs: PrimExpr
};

export type PrimAtomicExpr = PrimConstantExpr | PrimVarExpr | PrimTyConstExpr;

export type PrimBinopExpr = {
    type: 'binop',
    operator: string,
    left: PrimExpr,
    right: PrimExpr
};

export type PrimSubtermOccurence = {
    type: 'subterm',
    index: number,
    pos: number[]
};