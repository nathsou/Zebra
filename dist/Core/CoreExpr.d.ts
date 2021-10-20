import { Pattern } from "../Interpreter/Pattern";
import { Expr, VarExpr } from "../Parser/Expr";
export declare type CoreExpr = CoreAtomicExpr | CoreAppExpr | CoreIfThenElseExpr | CoreCaseOfExpr | CoreLambdaExpr | CoreLetInExpr | CoreLetRecInExpr;
export declare type CoreLambdaExpr = {
    type: 'lambda';
    arg: CoreVarExpr;
    body: CoreExpr;
};
export declare type CoreLetInExpr = {
    type: 'let_in';
    left: CoreVarExpr;
    middle: CoreExpr;
    right: CoreExpr;
};
export declare type CoreLetRecInExpr = {
    type: 'let_rec_in';
    funName: CoreVarExpr;
    arg: CoreVarExpr;
    middle: CoreExpr;
    right: CoreExpr;
};
export declare type CoreCaseOfExprCase = {
    pattern: Pattern;
    expr: CoreExpr;
};
export declare type CoreCaseOfExpr = {
    type: 'case_of';
    value: CoreExpr;
    arity: number;
    cases: CoreCaseOfExprCase[];
};
export declare type CoreVarExpr = VarExpr;
export declare type CoreTyConstExpr = {
    type: 'tyconst';
    name: string;
    args: CoreExpr[];
};
export declare type CoreConstantExpr = CoreIntegerExpr | CoreFloatExpr | CoreCharExpr;
export declare type CoreIntegerExpr = {
    type: 'constant';
    kind: 'integer';
    value: number;
};
export declare type CoreFloatExpr = {
    type: 'constant';
    kind: 'float';
    value: number;
};
export declare type CoreCharExpr = {
    type: 'constant';
    kind: 'char';
    value: string;
};
export declare type CoreIfThenElseExpr = {
    type: 'if_then_else';
    cond: CoreExpr;
    thenBranch: CoreExpr;
    elseBranch: CoreExpr;
};
export declare type CoreAppExpr = {
    type: 'app';
    lhs: CoreExpr;
    rhs: CoreExpr;
};
export declare type CoreAtomicExpr = CoreConstantExpr | CoreVarExpr | CoreTyConstExpr;
export declare const showCoreExpr: (e: CoreExpr, showVarIds?: boolean) => string;
export declare const exprOfCore: (e: CoreExpr) => Expr;
