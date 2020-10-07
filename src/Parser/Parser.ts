import { alt, keyword, leftassoc, many, map, oneOf, parens, Parser, sepBy, seq, symbol, token } from "./Combinators.ts";
import { Decl } from "./Decl.ts";
import { Expr, VarExpr, IntegerExpr, TyConstExpr, lambdaOf } from "./Expr.ts";

// https://www.haskell.org/onlinereport/syntax-iso.html

// allows us to use expr before initialization
const exp = () => expr;

const integer: Parser<IntegerExpr> = map(token('integer'), ({ value }) => ({
    type: 'constant', kind: 'integer', value
}));

const variable: Parser<VarExpr> = map(token('identifier'), ({ name }) => ({ type: 'variable', name }));

const tyconst: Parser<TyConstExpr> = map(token('tyconst'), ({ name }) => ({ type: 'tyconst', name, args: [] }));

const atomic: Parser<Expr> = oneOf(integer, variable, tyconst, parens(exp));

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
    seq(keyword('let'), variable, symbol('='), exp, keyword('in'), exp),
    ([_let, left, _eq, middle, _in, right]) => ({ type: 'let_in', left: left.name, middle, right })
), ifThenElse);

const letRecIn: Parser<Expr> = alt(map(
    seq(keyword('let'), keyword('rec'), variable, many(variable), symbol('='), exp, keyword('in'), exp),
    ([_let, _rec, f, args, _eq, middle, _in, right]) => ({
        type: 'let_rec_in',
        funName: f.name,
        arg: args[0].name,
        middle: args.length === 1 ? middle : lambdaOf(args.slice(1).map(a => a.name), middle),
        right
    })
), letIn);

const lambda = alt(map(
    seq(token('lambda'), many(variable), token('rightarrow'), exp),
    ([_lambda, args, _arrow, body]) => lambdaOf(args.map(id => id.name), body)
), letRecIn);

export const expr: Parser<Expr> = lambda;

const funDecl: Parser<Decl> = map(
    seq(token('identifier'), many(variable), symbol('='), expr, token('semicolon')),
    ([f, args, _eq, body, _semi]) => ({
        type: 'fun',
        name: f.name,
        args: args.map(a => a.name),
        body: body,
        curried: lambdaOf(args.map(a => a.name), body)
    })
);

export const decl: Parser<Decl> = funDecl;

export const program: Parser<Decl[]> = many(decl);