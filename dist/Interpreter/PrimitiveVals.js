"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.primitiveValEnv = void 0;
const Common_1 = require("../Utils/Common");
const Env_1 = require("../Utils/Env");
const intBinaryOp = (op) => {
    return {
        type: 'primitive_func',
        body: a => ({
            type: 'primitive_func',
            body: b => {
                Common_1.assert(a.type === 'int');
                Common_1.assert(b.type === 'int');
                return {
                    type: 'int',
                    value: op(a.value, b.value)
                };
            }
        })
    };
};
const floatBinaryOp = (op) => {
    return {
        type: 'primitive_func',
        body: a => ({
            type: 'primitive_func',
            body: b => {
                Common_1.assert(a.type === 'float');
                Common_1.assert(b.type === 'float');
                return {
                    type: 'float',
                    value: op(a.value, b.value)
                };
            }
        })
    };
};
const plusInt = intBinaryOp((a, b) => a + b);
const minusInt = intBinaryOp((a, b) => a - b);
const timesInt = intBinaryOp((a, b) => a * b);
const divideInt = intBinaryOp((a, b) => Math.floor(a / b));
const modInt = intBinaryOp((a, b) => a % b);
const intLogicalBinOp = (op) => {
    return {
        type: 'primitive_func',
        body: a => ({
            type: 'primitive_func',
            body: b => {
                Common_1.assert(a.type === 'int');
                Common_1.assert(b.type === 'int');
                return {
                    type: 'tyconst',
                    name: op(a.value, b.value) ? 'True' : 'False',
                    args: []
                };
            }
        })
    };
};
const floatLogicalBinOp = (op) => {
    return {
        type: 'primitive_func',
        body: a => ({
            type: 'primitive_func',
            body: b => {
                Common_1.assert(a.type === 'float');
                Common_1.assert(b.type === 'float');
                return {
                    type: 'tyconst',
                    name: op(a.value, b.value) ? 'True' : 'False',
                    args: []
                };
            }
        })
    };
};
const eqInt = intLogicalBinOp((a, b) => a === b);
const lssInt = intLogicalBinOp((a, b) => a < b);
const leqInt = intLogicalBinOp((a, b) => a <= b);
const gtrInt = intLogicalBinOp((a, b) => a > b);
const geqInt = intLogicalBinOp((a, b) => a >= b);
const stringOf = (str) => {
    return str
        .split('')
        .reverse()
        .reduce((prev, c) => ({
        type: 'tyconst',
        name: 'Cons',
        args: [{
                type: 'char',
                value: c
            }, prev]
    }), {
        type: 'tyconst',
        name: 'Nil',
        args: []
    });
};
const stringOfInt = {
    type: 'primitive_func',
    body: n => {
        Common_1.assert(n.type === 'int');
        return stringOf(`${n.value}`);
    }
};
const stringOFloat = {
    type: 'primitive_func',
    body: x => {
        Common_1.assert(x.type === 'float');
        return stringOf(`${x.value}`);
    }
};
const plusFloat = floatBinaryOp((a, b) => a + b);
const minusFloat = floatBinaryOp((a, b) => a - b);
const timesFloat = floatBinaryOp((a, b) => a * b);
const divideFloat = floatBinaryOp((a, b) => a / b);
const eqFloat = floatLogicalBinOp((a, b) => a === b);
const lssFloat = floatLogicalBinOp((a, b) => a < b);
const leqFloat = floatLogicalBinOp((a, b) => a <= b);
const gtrFloat = floatLogicalBinOp((a, b) => a > b);
const geqFloat = floatLogicalBinOp((a, b) => a >= b);
const floatOfInt = {
    type: 'primitive_func',
    body: a => {
        Common_1.assert(a.type === 'int');
        return {
            type: 'float',
            value: a.value
        };
    }
};
const eqChar = {
    type: 'primitive_func',
    body: a => ({
        type: 'primitive_func',
        body: b => {
            Common_1.assert(a.type === 'char');
            Common_1.assert(b.type === 'char');
            return {
                type: 'tyconst',
                name: a.value === b.value ? 'True' : 'False',
                args: []
            };
        }
    })
};
const primitiveVals = {
    'plusInt': plusInt,
    'minusInt': minusInt,
    'timesInt': timesInt,
    'divideInt': divideInt,
    'modInt': modInt,
    'eqInt': eqInt,
    'lssInt': lssInt,
    'leqInt': leqInt,
    'gtrInt': gtrInt,
    'geqInt': geqInt,
    'stringOfInt': stringOfInt,
    'plusFloat': plusFloat,
    'minusFloat': minusFloat,
    'timesFloat': timesFloat,
    'divideFloat': divideFloat,
    'eqFloat': eqFloat,
    'lssFloat': lssFloat,
    'leqFloat': leqFloat,
    'gtrFloat': gtrFloat,
    'geqFloat': geqFloat,
    'stringOfFloat': stringOFloat,
    'floatOfInt': floatOfInt,
    'eqChar': eqChar
};
const primitiveValEnv = () => {
    const env = Env_1.emptyEnv();
    for (const [f, val] of Object.entries(primitiveVals)) {
        Env_1.envAddMut(env, f, val);
    }
    return env;
};
exports.primitiveValEnv = primitiveValEnv;
