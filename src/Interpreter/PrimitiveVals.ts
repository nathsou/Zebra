import { assert } from "https://deno.land/std@0.83.0/testing/asserts.ts";
import { PrimitiveFunction } from "../Inferencer/Primitives.ts";
import { emptyEnv, envAddMut } from "../Utils/Env.ts";
import { PrimitiveFuncVal, Value } from "./Value.ts";

const intBinaryOp = (op: (a: number, b: number) => number): PrimitiveFuncVal => {
    return {
        type: 'primitive_func',
        body: a => ({
            type: 'primitive_func',
            body: b => {
                assert(a.type === 'int');
                assert(b.type === 'int');

                return {
                    type: 'int',
                    value: op(a.value, b.value)
                };
            }
        })
    };
};

const floatBinaryOp = (op: (a: number, b: number) => number): PrimitiveFuncVal => {
    return {
        type: 'primitive_func',
        body: a => ({
            type: 'primitive_func',
            body: b => {
                assert(a.type === 'float');
                assert(b.type === 'float');

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

const intLogicalBinOp = (op: (a: number, b: number) => boolean): PrimitiveFuncVal => {
    return {
        type: 'primitive_func',
        body: a => ({
            type: 'primitive_func',
            body: b => {
                assert(a.type === 'int');
                assert(b.type === 'int');

                return {
                    type: 'tyconst',
                    name: op(a.value, b.value) ? 'True' : 'False',
                    args: []
                };
            }
        })
    };
};

const floatLogicalBinOp = (op: (a: number, b: number) => boolean): PrimitiveFuncVal => {
    return {
        type: 'primitive_func',
        body: a => ({
            type: 'primitive_func',
            body: b => {
                assert(a.type === 'float');
                assert(b.type === 'float');

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

const stringOf = (str: string): Value => {
    return str
        .split('')
        .reverse()
        .reduce<Value>((prev, c) => ({
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

const stringOfInt: PrimitiveFuncVal = {
    type: 'primitive_func',
    body: n => {
        assert(n.type === 'int');
        return stringOf(`${n.value}`);
    }
};

const stringOFloat: PrimitiveFuncVal = {
    type: 'primitive_func',
    body: x => {
        assert(x.type === 'float');
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

const floatOfInt: PrimitiveFuncVal = {
    type: 'primitive_func',
    body: a => {
        assert(a.type === 'int');
        return {
            type: 'float',
            value: a.value
        };
    }
};

const eqChar: PrimitiveFuncVal = {
    type: 'primitive_func',
    body: a => ({
        type: 'primitive_func',
        body: b => {
            assert(a.type === 'char');
            assert(b.type === 'char');

            return {
                type: 'tyconst',
                name: a.value === b.value ? 'True' : 'False',
                args: []
            };
        }
    })
};

const primitiveVals: { [key in PrimitiveFunction]: PrimitiveFuncVal } = {
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

export const primitiveValEnv = () => {
    const env = emptyEnv<Value>();

    for (const [f, val] of Object.entries(primitiveVals)) {
        envAddMut(env, f, val);
    }

    return env;
};