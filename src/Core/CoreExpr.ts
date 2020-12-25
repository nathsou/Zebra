import { Pattern } from "../Interpreter/Pattern.ts";

export type CoreExpr = CoreAtomicExpr | CoreAppExpr | CoreIfThenElseExpr | CoreBinopExpr
    | CoreCaseOfExpr | CoreLambdaExpr | CoreLetInExpr | CoreLetRecInExpr;

export type CoreLambdaExpr = {
    type: 'lambda',
    arg: string,
    body: CoreExpr
};

export type CoreLetInExpr = {
    type: 'let_in',
    left: string,
    middle: CoreExpr,
    right: CoreExpr
};

export type CoreLetRecInExpr = {
    type: 'let_rec_in',
    funName: string,
    arg: string,
    middle: CoreExpr,
    right: CoreExpr
};

export type CoreCaseOfExprCase = {
    pattern: Pattern,
    expr: CoreExpr
};

export type CoreCaseOfExpr = {
    type: 'case_of',
    value: CoreExpr,
    arity: number,
    cases: CoreCaseOfExprCase[]
};

export type CoreVarExpr = {
    type: 'variable',
    name: string
};

export type CoreTyConstExpr = {
    type: 'tyconst',
    name: string,
    args: CoreExpr[]
};

export type CoreConstantExpr = CoreIntegerExpr;

export type CoreIntegerExpr = {
    type: 'constant',
    kind: 'integer',
    value: number
};

export type CoreIfThenElseExpr = {
    type: 'if_then_else',
    cond: CoreExpr,
    thenBranch: CoreExpr,
    elseBranch: CoreExpr
};

export type CoreAppExpr = {
    type: 'app',
    lhs: CoreExpr,
    rhs: CoreExpr
};

export type CoreAtomicExpr = CoreConstantExpr | CoreVarExpr | CoreTyConstExpr;

export type CoreBinopExpr = {
    type: 'binop',
    operator: string,
    left: CoreExpr,
    right: CoreExpr
};