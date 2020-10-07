import { MonoTy, TyConst, tyConst, typeVarNamer, TyVar } from "../Inferencer/Types.ts";
import { alt, keyword, leftassoc, many, map, oneOf, parens, Parser, sepBy, seq, some, symbol, token } from "./Combinators.ts";
import { Decl } from "./Decl.ts";
import { Expr, IntegerExpr, lambdaOf, VarExpr } from "./Expr.ts";

// https://www.haskell.org/onlinereport/syntax-iso.html

// expressions

// allows us to use expr before initialization
const exp = () => expr;

const integer: Parser<IntegerExpr> = map(token('integer'), ({ value }) => ({
    type: 'constant', kind: 'integer', value
}));

const variable: Parser<VarExpr> = map(token('identifier'), ({ name }) => ({ type: 'variable', name }));

const unit: Parser<Expr> = map(
    seq(token('lparen'), token('rparen')),
    () => ({ type: 'tyconst', name: '()', args: [] })
);

const atomic: Parser<Expr> = oneOf(integer, variable, unit, parens(exp));

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

const app: Parser<Expr> = alt(leftassoc(
    term,
    term,
    (lhs, rhs) => ({ type: 'app', lhs, rhs })
), term);

const comparison: Parser<Expr> = leftassoc(
    app,
    seq(oneOf(symbol('=='), symbol('<'), symbol('<='), symbol('>'), symbol('>=')), app),
    (left, [op, right]) => ({ type: 'binop', operator: op.name, left, right })
);

const ifThenElse: Parser<Expr> = alt(map(
    seq(keyword('if'), exp, keyword('then'), exp, keyword('else'), exp),
    ([_if, cond, _then, thenBranch, _else, elseBranch]) => ({ type: 'if_then_else', cond, thenBranch, elseBranch })
), comparison);

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

// declarations

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

const tyVarNames = typeVarNamer();

const typeVar: Parser<TyVar> = map(token('identifier'), ({ name }) => tyVarNames(name));

const typeConst: Parser<TyConst> = map(
    seq(token('identifier'), some(() => alt(map(token('identifier'), ({ name }) => tyConst(name)), parens(() => type)))),
    ([f, args]) => tyConst(f.name, ...args)
);

const type: Parser<MonoTy> = oneOf(typeVar, typeConst);

const dataTypeDecl: Parser<Decl> = alt(map(
    seq(keyword('data'), token('identifier'), symbol('='), sepBy(typeConst, 'pipe'), token('semicolon')),
    ([_dt, f, _eq, variants, _semi]) => ({
        type: 'datatype',
        name: f.name,
        variants
    })
), funDecl);

export const decl: Parser<Decl> = dataTypeDecl;

export const program: Parser<Decl[]> = some(decl);