import { MonoTy, TyConst, tyConst, typeVarNamer, TyVar } from "../Inferencer/Types.ts";
import { Fun, Pattern } from "../Interpreter/Pattern.ts";
import { alt, commas, keyword, leftassoc, many, map, oneOf, optional, parens, Parser, sepBy, seq, some, symbol, token } from "./Combinators.ts";
import { Decl } from "./Decl.ts";
import { CaseOfExpr, CaseOfExprCase, ConstantExpr, Expr, IntegerExpr, lambdaOf, TyConstExpr, VarExpr } from "./Expr.ts";

// https://www.haskell.org/onlinereport/syntax-iso.html

// expressions

// allows us to use expr before initialization
const exp = () => expr;

const integer: Parser<IntegerExpr> = map(token('integer'), ({ value }) => ({
    type: 'constant', kind: 'integer', value
}));

const constant: Parser<ConstantExpr> = oneOf(integer);

const variable: Parser<VarExpr> = map(token('variable'), ({ name }) => ({ type: 'variable', name }));
const identifier: Parser<VarExpr> = map(token('identifier'), ({ name }) => ({ type: 'variable', name }));

const unit: Parser<TyConstExpr> = map(
    seq(token('lparen'), token('rparen')),
    () => ({ type: 'tyconst', name: '()', args: [] })
);

const tuple: Parser<TyConstExpr> = alt(map(
    seq(token('lparen'), exp, token('comma'), commas(exp), token('rparen')),
    ([_l, h, _c, vals, _r]) => ({ type: 'tyconst', name: 'tuple', args: [h, ...vals] })
), unit);

const atomic: Parser<Expr> = oneOf(constant, variable, identifier, tuple, parens(exp));

const varPattern: Parser<Pattern> = map(token('variable'), ({ name }) => {
    if (name === '_') {
        return { name: '_', args: [] };
    } else {
        return name;
    }
});

const constantPat: Parser<Fun> = map(constant, c => {
    switch (c.kind) {
        case 'integer':
            return { name: `${c.value}`, args: [] }
    }
});

const nullaryFunPattern: Parser<Fun> = alt(map(
    token('identifier'),
    f => ({ name: f.name, args: [] })
), constantPat);

const funPattern: Parser<Fun> = alt(map(
    parens(seq(token('identifier'), some(() => pattern))),
    ([f, args]) => ({ name: f.name, args })
), nullaryFunPattern);

const unitPat = map(seq(token('lparen'), token('rparen')), () => ({ name: 'unit', args: [] }));
const tuplePat = map(
    seq(token('lparen'), () => pattern, token('comma'), commas(() => pattern), token('rparen')),
    ([_l, h, _c, vals, _r]) => ({ name: 'tuple', args: [h, ...vals] })
);
const pat = oneOf(varPattern, funPattern, tuplePat, unitPat);
const pattern: Parser<Pattern> = alt(pat, parens(pat));

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

const case_: Parser<CaseOfExprCase> = map(
    seq(pattern, token('rightarrow'), exp),
    ([p, _, e]) => ({ pattern: p, expr: e })
);

const caseOf: Parser<CaseOfExpr> = map(
    seq(keyword('case'), exp, keyword('of'), optional(token('pipe')), sepBy(case_, 'pipe')),
    ([_case, value, _of, _, cases]) => ({ type: 'case_of', value, cases })
);

const letIn: Parser<Expr> = alt(map(
    seq(keyword('let'), pattern, symbol('='), exp, keyword('in'), exp),
    ([_let, left, _eq, middle, _in, right]) => ({ type: 'let_in', left, middle, right })
), alt(caseOf, ifThenElse));

const letRecIn: Parser<Expr> = alt(map(
    seq(keyword('let'), keyword('rec'), variable, many(pattern), symbol('='), exp, keyword('in'), exp),
    ([_let, _rec, f, args, _eq, middle, _in, right]) => ({
        type: 'let_rec_in',
        funName: f.name,
        arg: args[0],
        middle: args.length === 1 ? middle : lambdaOf(args.slice(1), middle),
        right
    })
), letIn);

const lambda = alt(map(
    seq(token('lambda'), many(pattern), token('rightarrow'), exp),
    ([_lambda, args, _arrow, body]) => lambdaOf(args, body)
), letRecIn);

export const expr: Parser<Expr> = lambda;

// declarations

const funDecl: Parser<Decl> = map(
    seq(token('variable'), some(pattern), symbol('='), expr, token('semicolon')),
    ([f, args, _eq, body, _semi]) => ({
        type: 'fun',
        name: f.name,
        args,
        body: body,
        curried: lambdaOf(args, body)
    })
);

const tyVarNames = typeVarNamer();

const typeVar: Parser<TyVar> = map(token('variable'), ({ name }) => tyVarNames(name));

const typeConst: Parser<TyConst> = map(
    seq(token('identifier'),
        some(() => alt(
            map(token('identifier'), ({ name }) => tyConst(name)),
            typeVar,
            parens(() => type)
        ))
    ),
    ([f, args]) => tyConst(f.name, ...args)
);

const type: Parser<MonoTy> = oneOf(typeVar, typeConst);

const dataTypeDecl: Parser<Decl> = alt(map(
    seq(
        keyword('data'),
        token('identifier'),
        some(token('variable')),
        symbol('='),
        optional(token('pipe')),
        sepBy(typeConst, 'pipe'),
        token('semicolon')
    ),
    ([_dt, f, typeVars, _eq, _, variants, _semi]) => ({
        type: 'datatype',
        typeVars: typeVars.map(tv => tyVarNames(tv.name)),
        name: f.name,
        variants
    })
), funDecl);

export const decl: Parser<Decl> = dataTypeDecl;

export const program: Parser<Decl[]> = some(decl);