"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.showDecisionTree = exports.getOccurence = exports.makeSwitch = exports.makeLeaf = exports.makeFail = void 0;
const PrimitiveCompiler_1 = require("../Primitive/PrimitiveCompiler");
const makeFail = () => ({ type: 'fail' });
exports.makeFail = makeFail;
const makeLeaf = (action, bindings) => ({ type: 'leaf', action, bindings });
exports.makeLeaf = makeLeaf;
const makeSwitch = (occurence, tests) => {
    return {
        type: 'switch',
        occurence,
        tests
    };
};
exports.makeSwitch = makeSwitch;
const getOccurence = (args, occurence) => {
    let v = args[occurence.index];
    for (const idx of occurence.pos) {
        v = v.args[idx];
    }
    return v;
};
exports.getOccurence = getOccurence;
const showDecisionTree = (dt, arg) => {
    switch (dt.type) {
        case 'leaf':
            return PrimitiveCompiler_1.showPrim(dt.action);
        case 'fail':
            return `fail`;
        case 'switch':
            const cases = dt.tests.map(([ctor, subtree]) => {
                return `${ctor} -> ${exports.showDecisionTree(subtree, arg)}`;
            }).join('\n');
            return `switch ${PrimitiveCompiler_1.showPrim(arg)} ${JSON.stringify(dt.occurence)} {\n ${cases} \n}`;
    }
};
exports.showDecisionTree = showDecisionTree;
