"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.program = exports.decl = exports.expr = void 0;
const Casify_1 = require("../Core/Casify");
const Context_1 = require("../Inferencer/Context");
const FixedTypes_1 = require("../Inferencer/FixedTypes");
const Types_1 = require("../Inferencer/Types");
const Unification_1 = require("../Inferencer/Unification");
const Pattern_1 = require("../Interpreter/Pattern");
const Common_1 = require("../Utils/Common");
const Maybe_1 = require("../Utils/Maybe");
const Result_1 = require("../Utils/Result");
const Combinators_1 = require("./Combinators");
const Expr_1 = require("./Expr");
const Sugar_1 = require("./Sugar");
// https://www.haskell.org/onlinereport/syntax-iso.html
// expressions
const dummyBeforeInit = () => ({ ref: () => Result_1.error('dummy') });
exports.expr = dummyBeforeInit();
const pattern = dummyBeforeInit();
const internalPat = dummyBeforeInit();
const integer = Combinators_1.map(Combinators_1.token('integer'), ({ value }) => ({
    type: 'constant', kind: 'integer', value
}));
const charOf = (c) => ({
    type: 'constant',
    kind: 'char',
    value: c
});
const char = Combinators_1.map(Combinators_1.token('char'), ({ value: c }) => charOf(c));
const float = Combinators_1.map(Combinators_1.token('float'), ({ value }) => ({
    type: 'constant', kind: 'float', value
}));
const constant = Combinators_1.oneOf(integer, char, float);
const string = Combinators_1.map(Combinators_1.token('string'), ({ value }) => Sugar_1.listOf(value.split('').map(charOf)));
const symbolVariable = Combinators_1.map(Combinators_1.parens(Combinators_1.token('symbol')), ({ name }) => Expr_1.varOf(name));
const variable = Combinators_1.alt(Combinators_1.map(Combinators_1.token('variable'), ({ name }) => Expr_1.varOf(name)), symbolVariable);
const identifier = Combinators_1.map(Combinators_1.token('identifier'), ({ name }) => Expr_1.varOf(name));
const unit = Combinators_1.map(Combinators_1.seq(Combinators_1.token('lparen'), Combinators_1.token('rparen')), () => ({ type: 'tyconst', name: '()', args: [] }));
const tuple = Combinators_1.alt(Combinators_1.map(Combinators_1.seq(Combinators_1.token('lparen'), exports.expr, Combinators_1.token('comma'), Combinators_1.commas(exports.expr), Combinators_1.token('rparen')), ([_l, h, _c, vals, _r]) => ({ type: 'tyconst', name: 'tuple', args: [h, ...vals] })), unit);
const nil = Combinators_1.map(Combinators_1.seq(Combinators_1.token('lbracket'), Combinators_1.token('rbracket')), () => (({ type: 'tyconst', name: 'Nil', args: [] })));
const list = Combinators_1.alt(Combinators_1.map(Combinators_1.brackets(Combinators_1.commas(exports.expr)), Sugar_1.listOf), nil);
const atomic = Combinators_1.oneOf(Combinators_1.parens(exports.expr), constant, variable, identifier, tuple, list, string);
const factor = Combinators_1.leftassoc(atomic, Combinators_1.seq(Combinators_1.oneOf(Combinators_1.symbol('*'), Combinators_1.symbol('/'), Combinators_1.symbol('%')), atomic), (left, [op, right]) => Sugar_1.appOf(Expr_1.varOf(op.name), left, right));
const term = Combinators_1.leftassoc(factor, Combinators_1.seq(Combinators_1.oneOf(Combinators_1.symbol('+'), Combinators_1.symbol('-')), factor), (left, [op, right]) => Sugar_1.appOf(Expr_1.varOf(op.name), left, right));
const app = Combinators_1.leftassoc(term, term, (lhs, rhs) => ({ type: 'app', lhs, rhs }));
let cons = dummyBeforeInit();
cons.ref = Combinators_1.alt(Combinators_1.map(Combinators_1.seq(app, Combinators_1.token('cons'), cons), ([left, _, right]) => ({
    type: 'app',
    lhs: ({
        type: 'app',
        lhs: Expr_1.varOf('Cons'),
        rhs: left
    }),
    rhs: right
})), app);
const comparison = Combinators_1.leftassoc(cons, Combinators_1.seq(Combinators_1.oneOf(Combinators_1.symbol('=='), Combinators_1.symbol('/='), Combinators_1.symbol('<'), Combinators_1.symbol('<='), Combinators_1.symbol('>'), Combinators_1.symbol('>='), Combinators_1.symbol('++')), app), (left, [op, right]) => Sugar_1.appOf(Expr_1.varOf(op.name), left, right));
const ifThenElse = Combinators_1.alt(Combinators_1.map(Combinators_1.seq(Combinators_1.keyword('if'), exports.expr, Combinators_1.keyword('then'), exports.expr, Combinators_1.keyword('else'), exports.expr), ([_if, cond, _then, thenBranch, _else, elseBranch]) => ({
    type: 'if_then_else',
    cond,
    thenBranch,
    elseBranch
})), comparison);
const case_ = Combinators_1.map(Combinators_1.seq(internalPat, Combinators_1.token('rightarrow'), exports.expr), ([p, _, e]) => ({ pattern: p, expr: e }));
const caseOf = Combinators_1.map(Combinators_1.seq(Combinators_1.keyword('case'), exports.expr, Combinators_1.keyword('of'), Combinators_1.optional(Combinators_1.token('pipe')), Combinators_1.sepBy(case_, 'pipe')), ([_case, value, _of, _, cases]) => ({ type: 'case_of', arity: 1, value, cases }));
const letIn = Combinators_1.alt(Combinators_1.map(Combinators_1.seq(Combinators_1.keyword('let'), pattern, Combinators_1.symbol('='), exports.expr, Combinators_1.keyword('in'), exports.expr), ([_let, left, _eq, middle, _in, right]) => ({ type: 'let_in', left, middle, right })), Combinators_1.alt(caseOf, ifThenElse));
const letRecIn = Combinators_1.alt(Combinators_1.map(Combinators_1.seq(Combinators_1.keyword('let'), Combinators_1.keyword('rec'), variable, Combinators_1.many(pattern), Combinators_1.symbol('='), exports.expr, Combinators_1.keyword('in'), exports.expr), ([_let, _rec, f, args, _eq, middle, _in, right]) => ({
    type: 'let_rec_in',
    funName: Expr_1.varOf(f.name),
    arg: args[0],
    middle: args.length === 1 ? middle : Sugar_1.lambdaOf(args.slice(1), middle),
    right
})), letIn);
const lambda = Combinators_1.alt(Combinators_1.map(Combinators_1.seq(Combinators_1.token('lambda'), Combinators_1.many(pattern), Combinators_1.token('rightarrow'), exports.expr), ([_lambda, args, _arrow, body]) => Sugar_1.lambdaOf(args, body)), letRecIn);
exports.expr.ref = lambda;
// declarations
// function declarations
const funDecl = Combinators_1.map(Combinators_1.seq(variable, Combinators_1.some(pattern), Combinators_1.symbol('='), exports.expr), ([f, args, _eq, body]) => ({
    type: 'fun',
    funName: f,
    args,
    body: body
}));
const { name: tyNamer, reset: resetTyNamer } = Types_1.typeVarNamer();
const typeVar = Combinators_1.map(Combinators_1.token('variable'), ({ name }) => tyNamer(name));
let type = dummyBeforeInit();
const unitTy = Combinators_1.map(Combinators_1.seq(Combinators_1.token('lparen'), Combinators_1.token('rparen')), () => Types_1.tyConst('unit'));
const tupleTy = Combinators_1.alt(Combinators_1.map(Combinators_1.seq(Combinators_1.token('lparen'), type, Combinators_1.token('comma'), Combinators_1.commas(type), Combinators_1.token('rparen')), ([_l, h, _c, vals, _r]) => Types_1.tyConst('tuple', h, ...vals)), unitTy);
const typeConst = Combinators_1.map(Combinators_1.maybeParens(Combinators_1.seq(Combinators_1.token('identifier'), Combinators_1.some(Combinators_1.alt(Combinators_1.map(Combinators_1.token('identifier'), ({ name }) => Types_1.tyConst(name)), typeVar, tupleTy, Combinators_1.parens(type))))), ([f, args]) => Types_1.tyConst(f.name, ...args));
const funType = Combinators_1.map(Combinators_1.sepBy(Combinators_1.oneOf(typeVar, typeConst), 'rightarrow'), tys => tys.length > 1 ? FixedTypes_1.funTy(...tys) : tys[0]);
type.ref = Combinators_1.maybeParens(funType);
// datatype declarations
const dataTypeDecl = Combinators_1.alt(Combinators_1.map(Combinators_1.seq(Combinators_1.keyword('data'), Combinators_1.token('identifier'), Combinators_1.some(Combinators_1.token('variable')), Combinators_1.symbol('='), Combinators_1.optional(Combinators_1.token('pipe')), Combinators_1.sepBy(typeConst, 'pipe')), ([_dt, f, typeVars, _eq, _, variants]) => ({
    type: 'datatype',
    typeVars: typeVars.map(tv => tyNamer(tv.name)),
    name: f.name,
    variants
})), funDecl);
// type class declarations
const context = Combinators_1.map(Combinators_1.parens(Combinators_1.commas(Combinators_1.seq(Combinators_1.token('identifier'), Combinators_1.many(typeVar)))), constraints => constraints.map(([{ name }, tyVars]) => ({ name, tyVars: tyVars.map(t => t.value) })));
const typeAnnotation = Combinators_1.map(Combinators_1.seq(variable, Combinators_1.token('colon'), type), ([{ name }, _, ty]) => [name, Types_1.polyTy(ty, ...Unification_1.freeVarsMonoTy(ty))]);
const typeClassDeclOf = (context, name, tyVar, methods) => {
    resetTyNamer();
    return {
        type: 'typeclass',
        context,
        name,
        tyVar,
        methods: new Map(methods.map(([f, ty]) => {
            const sig = {};
            const tyVarClasses = new Map();
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
            const resTy = Types_1.polyTy(Result_1.okOrThrow(Unification_1.substituteMono(ty.ty, sig)), ...ty.polyVars);
            return [f, resTy];
        }))
    };
};
const typeClassDecl = Combinators_1.alt(Combinators_1.map(Combinators_1.seq(Combinators_1.keyword('class'), Combinators_1.optional(Combinators_1.seq(context, Combinators_1.token('bigarrow'))), Combinators_1.token('identifier'), typeVar, Combinators_1.keyword('where'), Combinators_1.sepBy(typeAnnotation, 'comma')), ([_cl, ctx, { name }, tyVar, _where, methods]) => typeClassDeclOf(Maybe_1.mapOrDefault(ctx, ([classes]) => classes, []), name, tyVar.value, methods)), dataTypeDecl);
// type class instance delcarations
const resetTyNamerAux = (v) => {
    resetTyNamer();
    return v;
};
const instanceDecl = Combinators_1.alt(Combinators_1.map(Combinators_1.seq(Combinators_1.keyword("instance"), Combinators_1.optional(Combinators_1.seq(context, Combinators_1.token('bigarrow'))), Combinators_1.token('identifier'), type, Combinators_1.keyword('where'), Combinators_1.sepBy(funDecl, 'comma')), ([_inst, ctx, { name }, ty, _where, defs]) => resetTyNamerAux({
    type: 'instance',
    context: Maybe_1.mapOrDefault(ctx, ([classes]) => classes, []),
    class_: name,
    ty,
    defs: Common_1.mapValues(Casify_1.groupByHead(defs), (decls, f) => [Context_1.nextTyVarId(), Casify_1.reducePatternMatchingToCaseOf(Casify_1.casify(f, decls))])
})), typeClassDecl);
// import declarations
const importDecl = Combinators_1.alt(Combinators_1.map(Combinators_1.seq(Combinators_1.keyword('import'), Combinators_1.token('string'), Combinators_1.parens(Combinators_1.commas(Combinators_1.alt(variable, identifier)))), ([_, path, imports]) => ({
    type: 'import',
    path: path.value,
    imports: imports.map(imp => imp.name)
})), instanceDecl);
// export declarations
const exportDecl = Combinators_1.alt(Combinators_1.map(Combinators_1.seq(Combinators_1.keyword('export'), Combinators_1.parens(Combinators_1.commas(Combinators_1.alt(variable, identifier)))), ([_, exports]) => ({
    type: 'export',
    exports: exports.map(e => e.name)
})), importDecl);
exports.decl = exportDecl;
exports.program = Combinators_1.sepBy(exports.decl, 'semicolon', true);
// patterns
const parensPat = Combinators_1.parens(pattern);
const varPattern = Combinators_1.alt(Combinators_1.map(Combinators_1.token('variable'), ({ name }) => {
    if (name === '_') {
        return { name: '_', args: [] };
    }
    else {
        return Pattern_1.patVarOf(name);
    }
}), parensPat);
const charPatOf = (c) => ({
    name: `'${c}'`,
    args: []
});
const constantPat = Combinators_1.alt(Combinators_1.map(constant, c => {
    switch (c.kind) {
        case 'integer':
        case 'float':
            return { name: `${c.value}`, args: [] };
        case 'char':
            return charPatOf(c.value);
    }
}), varPattern);
const nullaryFunPattern = Combinators_1.alt(Combinators_1.map(Combinators_1.token('identifier'), f => ({ name: f.name, args: [] })), constantPat);
const funPattern = Combinators_1.alt(Combinators_1.map(Combinators_1.parens(Combinators_1.seq(Combinators_1.token('identifier'), Combinators_1.some(pattern))), ([f, args]) => ({ name: f.name, args })), nullaryFunPattern);
internalPat.ref = Combinators_1.alt(Combinators_1.map(Combinators_1.seq(Combinators_1.token('identifier'), Combinators_1.some(pattern)), ([f, args]) => ({ name: f.name, args })), pattern);
const unitPat = Combinators_1.alt(Combinators_1.map(Combinators_1.seq(Combinators_1.token('lparen'), Combinators_1.token('rparen')), () => ({ name: 'unit', args: [] })), funPattern);
const tuplePat = Combinators_1.alt(Combinators_1.map(Combinators_1.seq(Combinators_1.token('lparen'), internalPat, Combinators_1.token('comma'), Combinators_1.commas(internalPat), Combinators_1.token('rparen')), ([_l, h, _c, vals, _r]) => ({ name: 'tuple', args: [h, ...vals] })), unitPat);
const nilPat = Combinators_1.alt(Combinators_1.map(Combinators_1.seq(Combinators_1.token('lbracket'), Combinators_1.token('rbracket')), () => ({ name: 'Nil', args: [] })), tuplePat);
const listPat = Combinators_1.alt(Combinators_1.map(Combinators_1.seq(Combinators_1.token('lbracket'), Combinators_1.commas(internalPat), Combinators_1.token('rbracket')), ([_l, vals, _r]) => [...vals].reverse()
    .reduce((acc, c) => ({ name: 'Cons', args: [c, acc] }), ({ name: 'Nil', args: [] }))), nilPat);
const stringPat = Combinators_1.alt(Combinators_1.map(Combinators_1.token('string'), ({ value }) => value.split('').map(charPatOf).reverse()
    .reduce((acc, c) => ({ name: 'Cons', args: [c, acc] }), ({ name: 'Nil', args: [] }))), listPat);
let consPat = dummyBeforeInit();
consPat.ref = Combinators_1.alt(Combinators_1.map(Combinators_1.seq(listPat, Combinators_1.token('cons'), consPat), ([left, _, right]) => ({
    name: 'Cons',
    args: [left, right]
})), stringPat);
pattern.ref = consPat.ref;
