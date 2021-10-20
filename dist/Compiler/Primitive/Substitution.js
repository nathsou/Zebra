"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.substitutePrim = void 0;
const Common_1 = require("../../Utils/Common");
const substitutePrim = (e, subst) => {
    switch (e.type) {
        case 'variable':
            if (Common_1.dictHas(subst, e.name)) {
                return Common_1.dictGet(subst, e.name);
            }
            return e;
        case 'app':
            return {
                type: 'app',
                lhs: exports.substitutePrim(e.lhs, subst),
                rhs: exports.substitutePrim(e.rhs, subst)
            };
        case 'constant':
            return e;
        case 'if_then_else':
            return {
                type: 'if_then_else',
                cond: exports.substitutePrim(e.cond, subst),
                thenBranch: exports.substitutePrim(e.thenBranch, subst),
                elseBranch: exports.substitutePrim(e.elseBranch, subst)
            };
        case 'lambda':
            return {
                type: 'lambda',
                arg: e.arg,
                body: exports.substitutePrim(e.body, subst)
            };
        case 'let_in':
            return {
                type: 'let_in',
                left: e.left,
                middle: exports.substitutePrim(e.middle, subst),
                right: exports.substitutePrim(e.right, subst)
            };
        case 'let_rec_in':
            return {
                type: 'let_rec_in',
                arg: e.arg,
                funName: e.funName,
                middle: exports.substitutePrim(e.middle, subst),
                right: exports.substitutePrim(e.right, subst)
            };
        case 'switch':
            return {
                type: 'switch',
                value: exports.substitutePrim(e.value, subst),
                dt: substituteDecisionTree(e.dt, subst)
            };
        case 'tyconst':
            return {
                type: 'tyconst',
                name: e.name,
                args: e.args.map(a => exports.substitutePrim(a, subst))
            };
        case 'subterm': return e;
    }
};
exports.substitutePrim = substitutePrim;
const substituteDecisionTree = (dt, subst) => {
    switch (dt.type) {
        case 'leaf':
            return {
                type: 'leaf',
                bindings: dt.bindings,
                action: exports.substitutePrim(dt.action, subst)
            };
        case 'switch':
            return {
                type: 'switch',
                occurence: dt.occurence,
                tests: dt.tests.map(([ctor, subtree]) => [ctor, substituteDecisionTree(subtree, subst)])
            };
    }
    return dt;
};
