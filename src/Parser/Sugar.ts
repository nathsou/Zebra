import { assert } from "../Utils/Common";
import { AppExpr, Expr, varOf } from "./Expr";

type LambdaExpr<T, K> = { type: 'lambda', arg: K, body: T };

/**
 * creates a curried lambda expression from a list of arguments and the body
 */
export const lambdaOf = <T, K>(args: K[], body: T) =>
  lambdaAux([...args].reverse(), body);

const lambdaAux = <T, K>(args: K[], body: T | LambdaExpr<T, K>): LambdaExpr<T | LambdaExpr<T, K>, K> => {
  assert(args.length > 0, 'lambdaOf called with a function with no arguments');
  if (args.length === 1) return { type: 'lambda', arg: args[0], body };
  const [h, tl] = [args[0], args.slice(1)];
  const subBody: LambdaExpr<T | LambdaExpr<T, K>, K> = { type: 'lambda', arg: h, body: body };
  return lambdaAux(tl, subBody) as LambdaExpr<T, K>;
};

export const listOf = (vals: Expr[]): Expr => {
  return cons(vals);
};

const Cons = varOf('Cons');
const Nil = varOf('Nil');

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

export const appOf = (...exprs: Expr[]): AppExpr => {
  assert(exprs.length > 1);

  const e = exprs.pop()!;

  return {
    type: 'app',
    lhs: exprs.length > 1 ? appOf(...exprs) : exprs[0],
    rhs: e
  };
};