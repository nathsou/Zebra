import { Pattern } from "../Interpreter/Pattern";
export declare type Expr = AtomicExpr | LetInExpr | LetRecInExpr | LambdaExpr | IfThenElseExpr | AppExpr | CaseOfExpr;
export declare const varOf: (name: string) => VarExpr;
export declare const varOfAux: (name: string) => VarExpr;
export declare type VarExpr = {
    type: 'variable';
    name: string;
    id: number;
};
export declare type TyConstExpr = {
    type: 'tyconst';
    name: string;
    args: Expr[];
};
export declare type ConstantExpr = IntegerExpr | FloatExpr | CharExpr;
export declare type IntegerExpr = {
    type: 'constant';
    kind: 'integer';
    value: number;
};
export declare type FloatExpr = {
    type: 'constant';
    kind: 'float';
    value: number;
};
export declare type CharExpr = {
    type: 'constant';
    kind: 'char';
    value: string;
};
export declare type LambdaExpr = {
    type: 'lambda';
    arg: Pattern;
    body: Expr;
};
export declare type LetInExpr = {
    type: 'let_in';
    left: Pattern;
    middle: Expr;
    right: Expr;
};
export declare type LetRecInExpr = {
    type: 'let_rec_in';
    funName: VarExpr;
    arg: Pattern;
    middle: Expr;
    right: Expr;
};
export declare type IfThenElseExpr = {
    type: 'if_then_else';
    cond: Expr;
    thenBranch: Expr;
    elseBranch: Expr;
};
export declare type AppExpr = {
    type: 'app';
    lhs: Expr;
    rhs: Expr;
};
export declare type AtomicExpr = ConstantExpr | VarExpr | TyConstExpr;
export declare type CaseOfExprCase = {
    pattern: Pattern;
    expr: Expr;
};
export declare type CaseOfExpr = {
    type: 'case_of';
    value: Expr;
    arity: number;
    cases: CaseOfExprCase[];
};
export declare const showExpr: (expr: Expr) => string;
