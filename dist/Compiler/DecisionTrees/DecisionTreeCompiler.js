"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.compileClauseMatrix = exports.defaultClauseMatrix = exports.specializeClauseMatrix = exports.clauseMatrixOf = exports.collectBindings = exports.subtermsOccurences = exports.dtPatternOf = exports.anyPat = void 0;
const Pattern_1 = require("../../Interpreter/Pattern");
const Common_1 = require("../../Utils/Common");
const Maybe_1 = require("../../Utils/Maybe");
const PrimitiveCompiler_1 = require("../Primitive/PrimitiveCompiler");
const DecisionTree_1 = require("./DecisionTree");
exports.anyPat = '_';
const dtPatternOf = (p) => {
    if (Pattern_1.isVar(p) || p.name === '_')
        return exports.anyPat;
    return { name: p.name, args: p.args.map(exports.dtPatternOf) };
};
exports.dtPatternOf = dtPatternOf;
const clauseMatrixRowOf = (p) => {
    // if (isFun(p) && p.name === 'tuple') {
    //     return p.args.map(dtPatternOf);
    // }
    return [exports.dtPatternOf(p)];
};
const subtermsOccurences = (p, sigma = {}, subTermIndex = 0) => {
    if (Pattern_1.isVar(p)) {
        return Common_1.dictSet(sigma, p.value, {
            type: 'subterm',
            index: subTermIndex,
            pos: []
        });
    }
    for (const [t, i] of Common_1.indexed(p.args)) {
        exports.collectBindings(t, sigma, i, {
            type: 'subterm',
            index: subTermIndex,
            pos: []
        });
    }
    return sigma;
};
exports.subtermsOccurences = subtermsOccurences;
const collectBindings = (p, sigma, localOffset = 0, parent) => {
    const occ = {
        type: 'subterm',
        index: parent.index,
        pos: [...parent.pos, localOffset]
    };
    if (Pattern_1.isVar(p)) {
        sigma[p.value] = occ;
    }
    else {
        for (const [s, idx] of Common_1.indexed(p.args)) {
            exports.collectBindings(s, sigma, idx, occ);
        }
    }
};
exports.collectBindings = collectBindings;
const actionOf = ({ expr, pattern }) => {
    const subst = {};
    // const args = isFun(pattern) && pattern.name === 'tuple' ?
    //     pattern.args :
    //     [pattern];
    const args = [pattern];
    // for (const [arg, idx] of indexed(args)) {
    //     subtermsOccurences(arg, subst, idx);
    // }
    exports.subtermsOccurences(args[0], subst, -1);
    return { action: PrimitiveCompiler_1.primitiveOf(expr), bindings: subst };
};
// all the rules must share the same head symbol and arity
const clauseMatrixOf = (expr) => {
    const patterns = expr.cases.map(c => clauseMatrixRowOf(c.pattern));
    return {
        patterns,
        dims: [expr.cases.length, patterns[0].length],
        actions: expr.cases.map(actionOf)
    };
};
exports.clauseMatrixOf = clauseMatrixOf;
const specializeRow = (row, ctor, arity) => {
    const [p, ps] = Common_1.decons(row);
    if (p === exports.anyPat)
        return [...Common_1.repeat(exports.anyPat, arity), ...ps];
    if (p.name === ctor)
        return [...p.args, ...ps];
};
const specializeClauseMatrix = (matrix, ctor, arity) => {
    const patterns = matrix.patterns
        .map(row => specializeRow(row, ctor, arity));
    const actions = [...Common_1.zip(patterns, matrix.actions)]
        .filter(([p, _a]) => p)
        .map(([_p, a]) => a);
    return {
        patterns: patterns.filter(Maybe_1.isSome),
        dims: [actions.length, arity + matrix.dims[1] - 1],
        actions
    };
};
exports.specializeClauseMatrix = specializeClauseMatrix;
const defaultRow = (row) => {
    const [p, ps] = Common_1.decons(row);
    if (p === exports.anyPat)
        return ps;
};
const defaultClauseMatrix = (matrix) => {
    const patterns = matrix.patterns.map(defaultRow);
    const actions = [...Common_1.zip(patterns, matrix.actions)]
        .filter(([p, _a]) => p)
        .map(([_p, a]) => a);
    return {
        patterns: patterns.filter(Maybe_1.isSome),
        dims: [actions.length, matrix.dims[1] - 1],
        actions
    };
};
exports.defaultClauseMatrix = defaultClauseMatrix;
const getColumn = (matrix, i) => {
    const col = [];
    for (const row of matrix.patterns) {
        col.push(row[i]);
    }
    return col;
};
const selectColumn = (matrix) => {
    for (let i = 0; i < matrix.dims[1]; i++) {
        if (getColumn(matrix, i).some(p => p !== exports.anyPat)) {
            return i;
        }
    }
    Common_1.unreachable('No valid column found');
    return 0;
};
const swapColumn = (matrix, i) => {
    for (const row of matrix.patterns) {
        Common_1.swapMut(row, 0, i);
    }
};
const heads = (patterns) => {
    const hds = new Map();
    for (const p of patterns) {
        if (p !== exports.anyPat) {
            hds.set(p.name, p.args.length);
        }
    }
    return hds;
};
let argIndex = 0;
const compileClauseMatrix = (argsCount, matrix, signature) => {
    // const occurences = [...gen(argsCount, i => ({ index: i, pos: [] }))];
    const occurences = [{ index: -1, pos: [], argIndex: argIndex++ }];
    return compileClauseMatrixAux(occurences, matrix, signature);
};
exports.compileClauseMatrix = compileClauseMatrix;
const compileClauseMatrixAux = (occurences, matrix, signature) => {
    const [m, n] = matrix.dims;
    if (m === 0)
        return DecisionTree_1.makeFail();
    if (m > 0 && (n === 0 || matrix.patterns[0].every(p => p === exports.anyPat))) {
        return DecisionTree_1.makeLeaf(matrix.actions[0].action, matrix.actions[0].bindings);
    }
    const colIdx = selectColumn(matrix);
    if (colIdx !== 0) {
        Common_1.swapMut(occurences, 0, colIdx);
        swapColumn(matrix, colIdx);
    }
    const col = getColumn(matrix, 0);
    const hds = heads(col);
    const tests = [];
    for (const [ctor, arity] of hds) {
        const o1 = [...Common_1.gen(arity, i => ({
                index: occurences[0].index,
                pos: [...occurences[0].pos, i],
                argIndex: 0
            }))];
        const A_k = compileClauseMatrixAux([...o1, ...Common_1.tail(occurences)], exports.specializeClauseMatrix(matrix, ctor, arity), signature);
        tests.push([ctor, A_k]);
    }
    if (!Common_1.setEq(hds, signature)) {
        const A_D = compileClauseMatrixAux(Common_1.tail(occurences), exports.defaultClauseMatrix(matrix), signature);
        tests.push([exports.anyPat, A_D]);
    }
    return DecisionTree_1.makeSwitch(Common_1.head(occurences), tests);
};
