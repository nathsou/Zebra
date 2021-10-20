import { Expr } from "./Expr";
export declare const renameVars: (e: Expr, renameMap: {
    [x: string]: string;
}) => Expr;
