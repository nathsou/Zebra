import { Pattern } from "../Interpreter/Pattern.ts";
import { showValue, TyConstVal } from "../Interpreter/Value.ts";
import { Expr, LambdaExpr, VarExpr } from "./Expr.ts";

/**
 * creates a curried lambda expression from a list of arguments and the body
 */
export const lambdaOf = (args: Pattern[], body: Expr): LambdaExpr => lambdaAux([...args].reverse(), body);

const lambdaAux = (args: Pattern[], body: Expr): LambdaExpr => {
    if (args.length === 0) return { type: 'lambda', arg: '_', body };
    if (args.length === 1) return { type: 'lambda', arg: args[0], body };
    const [h, tl] = [args[0], args.slice(1)];
    return lambdaAux(tl, { type: 'lambda', arg: h, body });
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