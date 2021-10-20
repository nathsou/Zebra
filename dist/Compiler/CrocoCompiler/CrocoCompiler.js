"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.crocoExprOf = exports.crocoPatternOf = exports.crocoDeclOf = exports.crocoProgramOf = void 0;
const Casify_1 = require("../../Core/Casify");
const ExprOfFunDecls_1 = require("../../Core/ExprOfFunDecls");
const Primitives_1 = require("../../Inferencer/Primitives");
const Pattern_1 = require("../../Interpreter/Pattern");
const RenameVars_1 = require("../../Parser/RenameVars");
const Symbols_1 = require("../../Parser/Symbols");
const Common_1 = require("../../Utils/Common");
const CrocoPrimitives_1 = require("./CrocoPrimitives");
const camel = (f) => {
    return `${f[0].toUpperCase()}${f.slice(1)}`;
};
const rename = (f) => {
    if (f === 'main')
        return 'Main';
    // @ts-ignore
    return `Ze${camel(f.replaceAll('_', ''))}`
        .split('')
        .map(c => Symbols_1.symbolRenameMap.has(c) ?
        (c === '_' ? 'U' : `${camel(Common_1.defined(Symbols_1.symbolRenameMap.get(c)))}`) :
        c)
        .join('');
};
const usedPrimitives = new Set();
const crocoProgramOf = (prog) => {
    usedPrimitives.clear();
    const topLevelFuncs = [];
    const funcNames = new Set();
    // collect function names
    for (const decl of prog) {
        if (decl.type === 'fun') {
            funcNames.add(decl.funName.name);
        }
    }
    const decls = prog
        .map(decl => exports.crocoDeclOf(decl, topLevelFuncs, funcNames))
        .filter(s => s.length > 0);
    const primFuncs = [...usedPrimitives]
        .map(f => Common_1.defined(CrocoPrimitives_1.crocoPrimitives().get(f)));
    return [primFuncs, topLevelFuncs, decls]
        .map(v => v.join('\n'))
        .join('\n');
};
exports.crocoProgramOf = crocoProgramOf;
const crocoDeclOf = (decl, topLevelFuncs, funcNames) => {
    switch (decl.type) {
        case 'datatype':
        case 'typeclass':
        case 'instance':
        case 'import':
        case 'export':
            return '';
        case 'fun':
            const name = rename(decl.funName.name);
            const args = decl.args.map(exports.crocoPatternOf).join(' ');
            const body = exports.crocoExprOf(decl.body, topLevelFuncs, funcNames);
            return `${name} ${args} = ${body}`;
    }
};
exports.crocoDeclOf = crocoDeclOf;
const crocoPatternOf = (pattern) => {
    if (Pattern_1.isVar(pattern))
        return pattern.value;
    if (pattern.name === 'Nil')
        return '[]';
    if (pattern.name === 'Cons') {
        const [h, tl] = pattern.args;
        return `(${exports.crocoPatternOf(h)}:${exports.crocoPatternOf(tl)})`;
    }
    if (pattern.name === 'tuple')
        return `(${pattern.args.map(exports.crocoPatternOf).join(', ')})`;
    if (pattern.name[0] === "'")
        return pattern.name.charCodeAt(1).toString();
    if (pattern.args.length === 0)
        return camel(pattern.name);
    return `(${camel(pattern.name)} ${pattern.args.map(exports.crocoPatternOf).join(' ')})`;
};
exports.crocoPatternOf = crocoPatternOf;
const crocoExprOf = (expr, topLevelFuncs, funcNames) => {
    switch (expr.type) {
        case 'variable':
            if (Primitives_1.isPrimitiveFunc(expr.name)) {
                usedPrimitives.add(expr.name);
                return rename(expr.name);
            }
            if (funcNames.has(expr.name)) {
                return rename(expr.name);
            }
            return expr.name;
        case 'tyconst':
            if (expr.args.length === 0)
                return camel(expr.name);
            if (expr.name === 'tuple')
                return `(${expr.args.map(a => exports.crocoExprOf(a, topLevelFuncs, funcNames)).join(', ')})`;
            return `(${camel(expr.name)} ${expr.args.map(a => exports.crocoExprOf(a, topLevelFuncs, funcNames)).join(' ')})`;
        case 'let_in': {
            const left = exports.crocoPatternOf(expr.left);
            const middle = exports.crocoExprOf(expr.middle, topLevelFuncs, funcNames);
            const right = exports.crocoExprOf(expr.right, topLevelFuncs, funcNames);
            return `let ${left} = ${middle} in ${right}`;
        }
        case 'let_rec_in': {
            const name = `LetRec${topLevelFuncs.length}`;
            const left = exports.crocoPatternOf(expr.arg);
            const middle = exports.crocoExprOf(RenameVars_1.renameVars(expr.middle, { [expr.funName.name]: name }), topLevelFuncs, funcNames);
            const right = exports.crocoExprOf(RenameVars_1.renameVars(expr.right, { [expr.funName.name]: name }), topLevelFuncs, funcNames);
            topLevelFuncs.push(`${name} ${left} = ${middle}`);
            return right;
        }
        case 'if_then_else':
            const cond = exports.crocoExprOf(expr.cond, topLevelFuncs, funcNames);
            const thenBranch = exports.crocoExprOf(expr.thenBranch, topLevelFuncs, funcNames);
            const elseBranch = exports.crocoExprOf(expr.elseBranch, topLevelFuncs, funcNames);
            return `(if ${cond} then ${thenBranch} else ${elseBranch})`;
        case 'constant':
            switch (expr.kind) {
                case 'integer':
                case 'float':
                    return `${expr.value}`;
                case 'char':
                    return `${expr.value.charCodeAt(0)}`;
            }
        case 'case_of': {
            const name = `CaseOf${topLevelFuncs.length}`;
            const freeVars = new Set();
            // collect free variables
            for (const c of expr.cases) {
                const fv = ExprOfFunDecls_1.coreExprFreeVars(Casify_1.coreOf(c.expr), ExprOfFunDecls_1.varEnvOf(...[...Pattern_1.vars(c.pattern)].map(v => v.value), ...funcNames, ...Primitives_1.primitives.keys()));
                for (const v of fv) {
                    if (v[0] === v[0].toLowerCase()) {
                        freeVars.add(v);
                    }
                }
            }
            const freeVarsArgs = [...freeVars].join(' ');
            for (const c of expr.cases) {
                const pat = exports.crocoPatternOf(c.pattern);
                const e = exports.crocoExprOf(c.expr, topLevelFuncs, funcNames);
                topLevelFuncs.push(`${name} ${pat} ${freeVarsArgs} = ${e}`);
            }
            const val = exports.crocoExprOf(expr.value, topLevelFuncs, funcNames);
            if (freeVarsArgs === '') {
                return `(${name} ${val})`;
            }
            return `(${name} ${val} ${freeVarsArgs})`;
        }
        case 'lambda': {
            const arg = exports.crocoPatternOf(expr.arg);
            const body = exports.crocoExprOf(expr.body, topLevelFuncs, funcNames);
            return `(\\${arg} -> ${body})`;
        }
        case 'app': {
            const lhs = exports.crocoExprOf(expr.lhs, topLevelFuncs, funcNames);
            const rhs = exports.crocoExprOf(expr.rhs, topLevelFuncs, funcNames);
            return `(${lhs} ${rhs})`;
        }
    }
};
exports.crocoExprOf = crocoExprOf;
