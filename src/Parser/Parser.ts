import { casify, groupByHead } from "../Core/Casify.ts";
import { funTy } from "../Inferencer/FixedTypes.ts";
import { MonoTy, PolyTy, polyTy, TyClass, TyConst, tyConst, typeVarNamer, TyVar } from "../Inferencer/Types.ts";
import { freeVarsMonoTy, substituteMono } from "../Inferencer/Unification.ts";
import { Pattern } from "../Interpreter/Pattern.ts";
import { mapValues } from "../Utils/Common.ts";
import { mapOrDefault } from "../Utils/Maybe.ts";
import { error, okOrThrow } from "../Utils/Result.ts";
import { alt, brackets, commas, keyword, leftassoc, many, map, maybeParens, oneOf, optional, parens, Parser, ParserRef, sepBy, seq, some, symbol, token } from "./Combinators.ts";
import { Decl, FuncDecl, TypeClassDecl } from "./Decl.ts";
import { CaseOfExpr, CaseOfExprCase, CharExpr, ConstantExpr, Expr, FloatExpr, IntegerExpr, TyConstExpr, VarExpr } from "./Expr.ts";
import { lambdaOf, listOf } from "./Sugar.ts";

// https://www.haskell.org/onlinereport/syntax-iso.html

// expressions

const dummyBeforeInit: () => ParserRef<any> = () => ({ ref: () => error('dummy') });

export const expr: ParserRef<Expr> = dummyBeforeInit();
const pattern: ParserRef<Pattern> = dummyBeforeInit();
const internalPat: ParserRef<Pattern> = dummyBeforeInit();

const integer: Parser<IntegerExpr> = map(token('integer'), ({ value }) => ({
    type: 'constant', kind: 'integer', value
}));

const charOf = (c: string): CharExpr => ({ type: 'constant', kind: 'char', value: c });

const char: Parser<CharExpr> = map(token('char'), ({ value: c }) => charOf(c));

const float: Parser<FloatExpr> = map(token('float'), ({ value }) => ({
    type: 'constant', kind: 'float', value
}));

const constant: Parser<ConstantExpr> = oneOf(integer, char, float);

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
    seq(internalPat, token('rightarrow'), expr),
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

// function declarations

const funDecl: Parser<Decl> = map(
    seq(token('variable'), some(pattern), symbol('='), expr),
    ([f, args, _eq, body]) => ({
        type: 'fun',
        name: f.name,
        args,
        body: body
    })
);

const tyVarNames = typeVarNamer();

const typeVar: Parser<TyVar> = map(token('variable'), ({ name }) => tyVarNames(name));

let type: ParserRef<MonoTy> = dummyBeforeInit();

const unitTy = map(seq(token('lparen'), token('rparen')), () => tyConst('unit'));

const tupleTy = alt(map(
    seq(token('lparen'), type, token('comma'), commas(type), token('rparen')),
    ([_l, h, _c, vals, _r]) => tyConst('tuple', h, ...vals)
), unitTy);

const typeConst: Parser<TyConst> = map(
    maybeParens(seq(token('identifier'),
        some(alt<MonoTy>(
            map(token('identifier'), ({ name }) => tyConst(name)),
            typeVar,
            tupleTy,
            parens(type)
        ))
    )),
    ([f, args]) => tyConst(f.name, ...args)
);

const funType: Parser<MonoTy> = map(
    sepBy(oneOf(typeVar, typeConst), 'rightarrow'),
    tys => tys.length > 1 ? funTy(...tys) : tys[0]
);

type.ref = maybeParens(funType);

// datatype declarations

const dataTypeDecl: Parser<Decl> = alt(map(
    seq(
        keyword('data'),
        token('identifier'),
        some(token('variable')),
        symbol('='),
        optional(token('pipe')),
        sepBy(typeConst, 'pipe')
    ),
    ([_dt, f, typeVars, _eq, _, variants]) => ({
        type: 'datatype',
        typeVars: typeVars.map(tv => tyVarNames(tv.name)),
        name: f.name,
        variants
    })
), funDecl);

// type class declarations

const context: Parser<TyClass[]> = map(
    parens(commas(seq(token('identifier'), many(typeVar)))),
    constraints => constraints.map(([{ name }, tyVars]) => ({ name, tyVars: tyVars.map(t => t.value) }))
);

const typeAnnotation: Parser<[string, PolyTy]> = map(
    seq(token('variable'), token('colon'), type),
    ([{ name }, _, ty]) => [name, polyTy(ty, ...freeVarsMonoTy(ty))]
);

const typeClassDeclOf = (
    context: TyClass[],
    name: string,
    tyVar: TyVar['value'],
    methods: [string, PolyTy][]
): TypeClassDecl => {
    return {
        type: 'typeclass',
        context,
        name,
        tyVar,
        methods: new Map(methods.map(([f, ty]) => {
            const sig: { [key: number]: MonoTy } = {};
            const tyVarClasses = new Map<number, string[]>();

            tyVarClasses.set(tyVar, [name]);

            for (const { name, tyVars } of context) {
                for (const v of tyVars) {
                    if (!tyVarClasses.has(v)) {
                        tyVarClasses.set(v, []);
                    }

                    tyVarClasses.get(v)?.push(name);
                }
            }

            for (const [v, classes] of tyVarClasses) {
                sig[v] = { value: v, context: classes };
            }

            const resTy = polyTy(
                okOrThrow(substituteMono(ty.ty, sig, new Map())),
                ...ty.polyVars
            );

            return [f, resTy];
        }))
    };
};

const typeClassDecl: Parser<Decl> = alt(map(
    seq(
        keyword('class'),
        optional(seq(context, token('bigarrow'))),
        token('identifier'),
        typeVar,
        keyword('where'),
        sepBy(typeAnnotation, 'comma')
    ),
    ([_cl, ctx, { name }, tyVar, _where, methods]) => typeClassDeclOf(
        mapOrDefault(ctx, ([classes]) => classes, []),
        name,
        tyVar.value,
        methods
    )
), dataTypeDecl);

// type class instance delcarations

const instanceDecl: Parser<Decl> = alt(map(
    seq(
        keyword("instance"),
        optional(seq(context, token('bigarrow'))),
        token('identifier'),
        typeConst,
        keyword('where'),
        sepBy(funDecl, 'comma')
    ),
    ([_inst, ctx, { name }, ty, _where, defs]) => ({
        type: 'instance',
        context: mapOrDefault(ctx, ([classes]) => classes, []),
        name,
        ty,
        defs: mapValues(
            groupByHead(defs as FuncDecl[]),
            (decls, f) => casify(f, decls)
        )
    })
), typeClassDecl);

export const decl: Parser<Decl> = instanceDecl;

export const program: Parser<Decl[]> = sepBy(decl, 'semicolon', true);


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
        case 'float':
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

internalPat.ref = alt(map(
    seq(token('identifier'), some(pattern)),
    ([f, args]) => ({ name: f.name, args })
), pattern);

const unitPat = alt(map(seq(token('lparen'), token('rparen')), () => ({ name: 'unit', args: [] })), funPattern);

const tuplePat = alt(map(
    seq(token('lparen'), internalPat, token('comma'), commas(internalPat), token('rparen')),
    ([_l, h, _c, vals, _r]) => ({ name: 'tuple', args: [h, ...vals] })
), unitPat);

const nilPat = alt(map(seq(token('lbracket'), token('rbracket')), () => ({ name: 'Nil', args: [] })), tuplePat);
const listPat = alt(map(
    seq(token('lbracket'), commas(internalPat), token('rbracket')),
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