import { AppExpr, Expr } from "./Expr";
declare type LambdaExpr<T, K> = {
    type: 'lambda';
    arg: K;
    body: T;
};
/**
 * creates a curried lambda expression from a list of arguments and the body
 */
export declare const lambdaOf: <T, K>(args: K[], body: T) => LambdaExpr<T | LambdaExpr<T, K>, K>;
export declare const listOf: (vals: Expr[]) => Expr;
export declare const cons: (vals: Expr[]) => Expr;
export declare const appOf: (...exprs: Expr[]) => AppExpr;
export {};
