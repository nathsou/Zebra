import { MonoTy, TyConst, tyConst, typeVarNamer, TyVar } from "../Inferencer/Types.ts";
import { Pattern } from "../Interpreter/Pattern.ts";
import { valuesEq } from "../Interpreter/Value.ts";
import { error } from "../Utils/Result.ts";
import { alt, brackets, commas, keyword, leftassoc, many, map, oneOf, optional, parens, Parser, ParserRef, sepBy, seq, some, symbol, token } from "./Combinators.ts";
import { Decl } from "./Decl.ts";
import { CaseOfExpr, CaseOfExprCase, CharExpr, ConstantExpr, Expr, IntegerExpr, TyConstExpr, VarExpr } from "./Expr.ts";
import { lambdaOf, listOf } from "./Sugar.ts";

// https://www.haskell.org/onlinereport/syntax-iso.html

// expressions

const dummyBeforeInit: () => ParserRef<any> = () => ({ ref: () => error('dummy') });

export let expr: ParserRef<Expr> = dummyBeforeInit();
let pattern: ParserRef<Pattern> = dummyBeforeInit();

const integer: Parser<IntegerExpr> = map(token('integer'), ({ value }) => ({
    type: 'constant', kind: 'integer', value
}));

const charOf = (c: string): CharExpr => ({ type: 'constant', kind: 'char', value: c });

const char: Parser<CharExpr> = map(token('char'), ({ value: c }) => charOf(c));

const constant: Parser<ConstantExpr> = oneOf(integer, char);

const string: Parser<Expr> = map(token('string'), ({ value }) => 
    listOf(value.split('').map(charOf)));

const variable: Parser<VarExpr> = map(token('variable'), ({ name }) => ({ type: 'variable', name }));
const identifier: Parser<VarExpr> = map(token('identifier'), ({ name }) => ({ type: 'variable', name }));

const unit: Parser<TyConstExpr> = map(
    seq(token('lparen'), token('rparen')),
    () => ({ type: 'tyconst', name: '()', args: [] })
);

const tuple: Parser<TyConstExpr> = alt(map(
    seq(token('lparen'), expr, token('comma'), commas(expr), token('rparen')),
    ([_l, h, _c, vals, _r]) => ({ type: 'tyconst', name: 'tuple', args: [h, ...vals] })
), unit);

const nil: Parser<Expr> = map(
    seq(token('lbracket'), token('rbracket')),
    () => ({ type: 'tyconst', name: 'Nil', args: [] })
);

const list = alt(map(brackets(commas(expr)), listOf), nil);

const atomic: Parser<Expr> = oneOf(parens(expr), constant, variable, identifier, tuple, list, string);

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

const app: Parser<Expr> = leftassoc(
    term,
    term,
    (lhs, rhs) => ({ type: 'app', lhs, rhs })
);

let cons: ParserRef<Expr> = dummyBeforeInit();

cons.ref = alt(map(
    seq(app, token('cons'), cons),
    ([left, _, right]) => ({
        type: 'app',
        lhs: {
            type: 'app',
            lhs: { type: 'variable', name: 'Cons' },
            rhs: left
        },
        rhs: right
    })
), app);

const comparison: Parser<Expr> = leftassoc(
    cons,
    seq(oneOf(symbol('=='), symbol('<'), symbol('<='), symbol('>'), symbol('>=')), app),
    (left, [op, right]) => ({ type: 'binop', operator: op.name, left, right })
);

const ifThenElse: Parser<Expr> = alt(map(
    seq(keyword('if'), expr, keyword('then'), expr, keyword('else'), expr),
    ([_if, cond, _then, thenBranch, _else, elseBranch]) => ({ type: 'if_then_else', cond, thenBranch, elseBranch })
), comparison);

const case_: Parser<CaseOfExprCase> = map(
    seq(pattern, token('rightarrow'), expr),
    ([p, _, e]) => ({ pattern: p, expr: e })
);

const caseOf: Parser<CaseOfExpr> = map(
    seq(keyword('case'), expr, keyword('of'), optional(token('pipe')), sepBy(case_, 'pipe')),
    ([_case, value, _of, _, cases]) => ({ type: 'case_of', arity: 1, value, cases })
);

const letIn: Parser<Expr> = alt(map(
    seq(keyword('let'), pattern, symbol('='), expr, keyword('in'), expr),
    ([_let, left, _eq, middle, _in, right]) => ({ type: 'let_in', left, middle, right })
), alt(caseOf, ifThenElse));

const letRecIn: Parser<Expr> = alt(map(
    seq(keyword('let'), keyword('rec'), variable, many(pattern), symbol('='), expr, keyword('in'), expr),
    ([_let, _rec, f, args, _eq, middle, _in, right]) => ({
        type: 'let_rec_in',
        funName: f.name,
        arg: args[0],
        middle: args.length === 1 ? middle : lambdaOf(args.slice(1), middle),
        right
    })
), letIn);

const lambda = alt(map(
    seq(token('lambda'), many(pattern), token('rightarrow'), expr),
    ([_lambda, args, _arrow, body]) => lambdaOf(args, body)
), letRecIn);

expr.ref = lambda;

// declarations

const funDecl: Parser<Decl> = map(
    seq(token('variable'), some(pattern), symbol('='), expr, token('semicolon')),
    ([f, args, _eq, body, _semi]) => ({
        type: 'fun',
        name: f.name,
        args,
        body: body
    })
);

const tyVarNames = typeVarNamer();

const typeVar: Parser<TyVar> = map(token('variable'), ({ name }) => tyVarNames(name));

const unitTy = map(seq(token('lparen'), token('rparen')), () => tyConst('unit'));

let type: ParserRef<MonoTy> = dummyBeforeInit();

const tupleTy = alt(map(
    seq(token('lparen'), type, token('comma'), commas(type), token('rparen')),
    ([_l, h, _c, vals, _r]) => tyConst('tuple', h, ...vals)
), unitTy);

const typeConst: Parser<TyConst> = map(
    seq(token('identifier'),
        some(alt<MonoTy>(
            map(token('identifier'), ({ name }) => tyConst(name)),
            typeVar,
            tupleTy,
            parens(type)
        ))
    ),
    ([f, args]) => tyConst(f.name, ...args)
);

type.ref = oneOf(typeVar, typeConst);

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

// patterns

const parensPat = parens(pattern);

const varPattern: Parser<Pattern> = alt(map(token('variable'), ({ name }) => {
    if (name === '_') {
        return { name: '_', args: [] };
    } else {
        return name;
    }
}), parensPat);

const charPatOf = (c: string): Pattern => ({
    name: `'${c}'`,
    args: []
});

const constantPat: Parser<Pattern> = alt(map(constant, c => {
    switch (c.kind) {
        case 'integer':
            return { name: `${c.value}`, args: [] };
        case 'char':
            return charPatOf(c.value);
    }
}), varPattern);

const nullaryFunPattern: Parser<Pattern> = alt(map(
    token('identifier'),
    f => ({ name: f.name, args: [] })
), constantPat);

const funPattern: Parser<Pattern> = alt(map(
    parens(seq(token('identifier'), some(pattern))),
    ([f, args]) => ({ name: f.name, args })
), nullaryFunPattern);

const unitPat = alt(map(seq(token('lparen'), token('rparen')), () => ({ name: 'unit', args: [] })), funPattern);

const tuplePat = alt(map(
    seq(token('lparen'), pattern, token('comma'), commas(pattern), token('rparen')),
    ([_l, h, _c, vals, _r]) => ({ name: 'tuple', args: [h, ...vals] })
), unitPat);

const nilPat = alt(map(seq(token('lbracket'), token('rbracket')), () => ({ name: 'Nil', args: [] })), tuplePat);
const listPat = alt(map(
    seq(token('lbracket'), commas(pattern), token('rbracket')),
    ([_l, vals, _r]) => [...vals].reverse()
        .reduce((acc, c) => ({ name: 'Cons', args: [c, acc] }), ({ name: 'Nil', args: [] }))
), nilPat);

const stringPat = alt(map(
    token('string'),
    ({ value }) => value.split('').map(charPatOf).reverse()
        .reduce((acc, c) => ({ name: 'Cons', args: [c, acc] }), ({ name: 'Nil', args: [] }))
), listPat);

let consPat: ParserRef<Pattern> = dummyBeforeInit();

consPat.ref = alt(map(
    seq(listPat, token('cons'), consPat),
    ([left, _, right]) => ({
        name: 'Cons',
        args: [left, right]
    })
), stringPat);

pattern.ref = consPat.ref;