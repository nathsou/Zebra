"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assert = exports.addSet = exports.cache = exports.mapOf = exports.sameElems = exports.find = exports.defined = exports.mapValues = exports.zipObject = exports.deepCopy = exports.swap = exports.swapMut = exports.setEq = exports.decons = exports.tail = exports.last = exports.head = exports.repeat = exports.range = exports.indexed = exports.every = exports.some = exports.zip = exports.dictMap = exports.dictKeys = exports.dictValues = exports.dictEntries = exports.dictGet = exports.dictHas = exports.dictSet = exports.unreachable = exports.gen = exports.partition = void 0;
const Maybe_1 = require("./Maybe");
const partition = (vals, pred) => {
    const as = [];
    const bs = [];
    for (const v of vals) {
        if (pred(v)) {
            as.push(v);
        }
        else {
            bs.push(v);
        }
    }
    return [as, bs];
};
exports.partition = partition;
const gen = (count, f) => {
    const vals = [];
    for (let i = 0; i < count; i++) {
        vals.push(f(i));
    }
    return vals;
};
exports.gen = gen;
const unreachable = (msg = '') => {
    throw Error(`Code marked as unreachable was reached: ${msg}`);
};
exports.unreachable = unreachable;
function dictSet(dict, key, value) {
    dict[key] = value;
    return dict;
}
exports.dictSet = dictSet;
function dictHas(dict, key) {
    // https://eslint.org/docs/rules/no-prototype-builtins
    return Object.prototype.hasOwnProperty.call(dict, key);
}
exports.dictHas = dictHas;
function dictGet(dict, key) {
    return dict[key];
}
exports.dictGet = dictGet;
function dictEntries(dict) {
    return Object.entries(dict);
}
exports.dictEntries = dictEntries;
function dictValues(dict) {
    return Object.values(dict);
}
exports.dictValues = dictValues;
function dictKeys(dict) {
    return Object.keys(dict);
}
exports.dictKeys = dictKeys;
function dictMap(dict, f) {
    const newDict = {};
    for (const [key, val] of dictEntries(dict)) {
        dictSet(newDict, key, f(val));
    }
    return newDict;
}
exports.dictMap = dictMap;
function* zip(as, bs) {
    const len = Math.min(as.length, bs.length);
    for (let i = 0; i < len; i++) {
        yield [as[i], bs[i]];
    }
}
exports.zip = zip;
function some(it, pred) {
    for (const val of it) {
        if (pred(val))
            return true;
    }
    return false;
}
exports.some = some;
function every(it, pred) {
    for (const val of it) {
        if (!pred(val))
            return false;
    }
    return true;
}
exports.every = every;
function* indexed(vals) {
    let i = 0;
    for (const val of vals) {
        yield [val, i++];
    }
}
exports.indexed = indexed;
function* range(from, to, step = 1) {
    for (let i = from; i < to; i += step) {
        yield i;
    }
}
exports.range = range;
function* repeat(val, count) {
    for (let i = 0; i < count; i++) {
        yield val;
    }
}
exports.repeat = repeat;
function head(list) {
    return list[0];
}
exports.head = head;
function last(list) {
    return list[list.length - 1];
}
exports.last = last;
function tail(list) {
    return list.slice(1);
}
exports.tail = tail;
function decons(list) {
    return [head(list), tail(list)];
}
exports.decons = decons;
function setEq(as, bs) {
    return as.size === bs.size && !some(as.keys(), a => !bs.has(a));
}
exports.setEq = setEq;
function swapMut(vals, i, j) {
    if (i < 0 || j < 0 || i >= vals.length || j >= vals.length) {
        throw new Error(`invalid swap indices, len: ${vals.length}, i: ${i}, j: ${j}`);
    }
    const tmp = vals[i];
    vals[i] = vals[j];
    vals[j] = tmp;
}
exports.swapMut = swapMut;
function swap(vals, i, j) {
    const copy = [...vals];
    swapMut(copy, i, j);
    return copy;
}
exports.swap = swap;
const deepCopy = (obj) => {
    return JSON.parse(JSON.stringify(obj));
};
exports.deepCopy = deepCopy;
const zipObject = (keys, values) => {
    const obj = {};
    for (const [key, value] of zip(keys, values)) {
        obj[key] = value;
    }
    return obj;
};
exports.zipObject = zipObject;
const mapValues = (m, f) => {
    const m2 = new Map();
    for (const [k, v] of m) {
        m2.set(k, f(v, k));
    }
    return m2;
};
exports.mapValues = mapValues;
// use only when we know for sure that a value is defined
const defined = (v) => {
    if (v === undefined) {
        throw new Error(`called 'defined' on an undefined value`);
    }
    else {
        return v;
    }
};
exports.defined = defined;
const find = (vals, pred) => {
    for (const v of vals) {
        if (pred(v))
            return v;
    }
    return Maybe_1.None;
};
exports.find = find;
const sameElems = (a, b) => {
    if (a.length !== b.length)
        return false;
    const aSet = new Set(a);
    const bSet = new Set(b);
    for (const s of aSet) {
        if (!bSet.has(s))
            return false;
    }
    return true;
};
exports.sameElems = sameElems;
const mapOf = (obj) => {
    const map = new Map();
    for (const [key, val] of Object.entries(obj)) {
        map.set(key, val);
    }
    return map;
};
exports.mapOf = mapOf;
const cache = (f) => {
    let cachedVal = Maybe_1.None;
    return () => {
        if (Maybe_1.isNone(cachedVal)) {
            cachedVal = f();
        }
        return cachedVal;
    };
};
exports.cache = cache;
const addSet = (m, key, ...values) => {
    if (!m.has(key)) {
        m.set(key, new Set());
    }
    for (const v of values) {
        m.get(key)?.add(v);
    }
};
exports.addSet = addSet;
function assert(test, message = '') {
    if (!test) {
        throw new Error(`assertion failed: ${message}`);
    }
}
exports.assert = assert;
