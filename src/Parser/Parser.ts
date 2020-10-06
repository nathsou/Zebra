import { alt, keyword, leftassoc, many, map, oneOf, parens, Parser, seq, symbol, token } from "./Combinators.ts";
import { Expr, IdentifierExpr, IntegerExpr, LambdaExpr, showExpr, TyConstExpr } from "./Expr.ts";

// https://www.haskell.org/onlinereport/syntax-iso.html

// allows us to use expr before initialization
const exp = () => expr;

const integer: Parser<IntegerExpr> = map(token('integer'), ({ value }) => ({
    type: 'constant', kind: 'integer', value
}));

const identifier: Parser<IdentifierExpr> = map(token('identifier'), ({ name }) => ({ type: 'identifier', name }));

const tyconst: Parser<TyConstExpr> = map(token('tyconst'), ({ name }) => ({ type: 'tyconst', name, args: [] }));

const atomic: Parser<Expr> = oneOf(integer, identifier, tyconst, parens(exp));

const factor: Parser<Expr> = leftassoc(
    atomic,
    seq(oneOf(symbol('*'), symbol('/'), symbol('%')), atomic),
    (left, [op, right]) => ({ type: 'binop', operator: op.name, left, right })
);

const term: Parser<Expr> = leftassoc(
    factor,
    seq(oneOf(symbol('+'), symbol('-')), factor),
    (left, [op, right]) => ({ type: 'binop', operator: op.name, left, right })
);

const comparison: Parser<Expr> = leftassoc(
    term,
    seq(oneOf(symbol('=='), symbol('<'), symbol('<='), symbol('>'), symbol('>=')), term),
    (left, [op, right]) => ({ type: 'binop', operator: op.name, left, right })
);

const app: Parser<Expr> = alt(leftassoc(
    comparison,
    comparison,
    (lhs, rhs) => ({ type: 'app', lhs, rhs })
), comparison);

const ifThenElse: Parser<Expr> = alt(map(
    seq(keyword('if'), exp, keyword('then'), exp, keyword('else'), exp),
    ([_if, cond, _then, thenBranch, _else, elseBranch]) => ({ type: 'if_then_else', cond, thenBranch, elseBranch })
), app);

const letIn: Parser<Expr> = alt(map(
    seq(keyword('let'), identifier, symbol('='), exp, keyword('in'), exp),
    ([_let, left, _eq, middle, _in, right]) => ({ type: 'let_in', left: left.name, middle, right })
), ifThenElse);

const letRecIn: Parser<Expr> = alt(map(
    seq(keyword('let'), keyword('rec'), identifier, identifier, symbol('='), exp, keyword('in'), exp),
    ([_let, _rec, f, arg, _eq, middle, _in, right]) => ({
        type: 'let_rec_in',
        funName: f.name,
        arg: arg.name,
        middle,
        right
    })
), letIn);

const lambdaOf = (args: string[], body: Expr): LambdaExpr => lambdaAux([...args].reverse(), body);

const lambdaAux = (args: string[], body: Expr): LambdaExpr => {
    if (args.length === 1) return { type: 'lambda', arg: args[0], body };
    const [h, tl] = [args[0], args.slice(1)];
    return lambdaAux(tl, { type: 'lambda', arg: h, body });
};

const lambda = alt(map(
    seq(token('lambda'), many(identifier), token('rightarrow'), exp),
    ([_lambda, args, _arrow, body]) => lambdaOf(args.map(id => id.name), body)
), letRecIn);

export const expr: Parser<Expr> = lambda;