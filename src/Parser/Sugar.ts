import { assert } from "https://deno.land/std@0.73.0/testing/asserts.ts";
import { showValue, TyConstVal } from "../Interpreter/Value.ts";
import { Expr, VarExpr } from "./Expr.ts";

type LambdaExpr<T, K> = { type: 'lambda', arg: K, body: T };

/**
 * creates a curried lambda expression from a list of arguments and the body
 */
export const lambdaOf = <T, K>(args: K[], body: T) =>
    lambdaAux([...args].reverse(), body);

const lambdaAux = <T, K>(args: K[], body: T | LambdaExpr<T, K>): LambdaExpr<T | LambdaExpr<T, K>, K> => {
    assert(args.length > 0);
    if (args.length === 1) return { type: 'lambda', arg: args[0], body };
    const [h, tl] = [args[0], args.slice(1)];
    const subBody: LambdaExpr<T | LambdaExpr<T, K>, K> = { type: 'lambda', arg: h, body: body };
    return lambdaAux(tl, subBody) as LambdaExpr<T, K>;
};

export const listOf = (vals: Expr[]): Expr => {
    return cons(vals);
};

const Cons: VarExpr = { type: 'variable', name: 'Cons' };
const Nil: VarExpr = { type: 'variable', name: 'Nil' };

export const cons = (vals: Expr[]): Expr => {
    if (vals.length === 0) return Nil;
    return {
        type: 'app',
        lhs: {
            type: 'app',
            lhs: Cons,
            rhs: vals[0]
        },
        rhs: cons(vals.slice(1))
    };
};

export const showList = (lst: TyConstVal): string => {
    let acc = '';

    while (lst.name !== 'Nil') {
        const tail = showValue(lst.args[0]);
        acc += acc.length === 0 ? tail : `, ${tail}`;
        lst = lst.args[1] as TyConstVal;
    }

    return `[${acc}]`;
};