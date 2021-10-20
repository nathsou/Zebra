"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.showValEnv = exports.showList = exports.showValue = exports.valuesEq = exports.ty = void 0;
const CoreExpr_1 = require("../Core/CoreExpr");
// Type constructor, constructor
const ty = (name, ...args) => {
    return { type: 'tyconst', name, args };
};
exports.ty = ty;
const valuesEq = (a, b) => {
    if (a.type !== b.type)
        return false;
    switch (a.type) {
        case 'int':
            return a.value === b.value;
        case 'float':
            return a.value === b.value;
        case 'char':
            return a.value === b.value;
        case 'closure':
            return false;
        case 'recvar':
            return false;
        case 'tyconst':
            return a.name === b.name &&
                a.args.length === b.args.length &&
                a.args.every((s, i) => exports.valuesEq(s, b.args[i]));
        case 'primitive_func':
            return false;
    }
};
exports.valuesEq = valuesEq;
const showValue = (val) => {
    switch (val.type) {
        case 'int':
        case 'float':
            return `${val.value}`;
        case 'char':
            return `'${val.value}'`;
        case 'closure':
            return `λ${val.arg} -> ${CoreExpr_1.showCoreExpr(val.body)}`;
        case 'tyconst':
            switch (val.name) {
                case 'tuple':
                    return `(${val.args.map(exports.showValue).join(', ')})`;
                case 'Nil':
                    return '[]';
                case 'Cons':
                    return exports.showList(val);
            }
            if (val.args.length === 0) {
                return val.name;
            }
            else {
                return `(${val.name} ${val.args.map(exports.showValue).join(' ')})`;
            }
        case 'recvar':
            return `rec λ${val.arg} -> ${CoreExpr_1.showCoreExpr(val.body)}`;
        case 'primitive_func':
            return `<primitive_func>`;
    }
};
exports.showValue = showValue;
const showList = (lst) => {
    let acc = '';
    while (lst.name !== 'Nil') {
        const tail = exports.showValue(lst.args[0]);
        acc += acc.length === 0 ? tail : `, ${tail}`;
        lst = lst.args[1];
    }
    return `[${acc}]`;
};
exports.showList = showList;
const showValEnv = (env) => {
    return `{ ${Object.entries(env).map(([x, val]) => `${x} = ${exports.showValue(val)}`).join(', ')} }`;
};
exports.showValEnv = showValEnv;
