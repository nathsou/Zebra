"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.promiseOf = exports.okOrThrow = exports.fold = exports.reduceResult = exports.mapResult = exports.bindWith = exports.bind4 = exports.bind3 = exports.bind2 = exports.bind = exports.isError = exports.isOk = exports.error = exports.ok = void 0;
/**
 * constructs a successful result
 */
const ok = (value) => ({ type: "ok", value });
exports.ok = ok;
/**
 * construct an unsuccessfully result
 */
const error = (value) => ({
    type: "error",
    value
});
exports.error = error;
/**
 * checks wether res matches the  variant of Result
 */
const isOk = (res) => res.type === "ok";
exports.isOk = isOk;
/**
* checks wether res matches the 'Error' variant of Result
*/
const isError = (res) => res.type === "error";
exports.isError = isError;
/**
 * bind for the Result Monad
 */
const bind = (res, f) => {
    if (exports.isError(res))
        return res;
    return f(res.value);
};
exports.bind = bind;
const bind2 = (a, b, f) => {
    if (exports.isError(a))
        return a;
    if (exports.isError(b))
        return b;
    return f([a.value, b.value]);
};
exports.bind2 = bind2;
const bind3 = (a, b, c, f) => {
    if (exports.isError(a))
        return a;
    if (exports.isError(b))
        return b;
    if (exports.isError(c))
        return c;
    return f([a.value, b.value, c.value]);
};
exports.bind3 = bind3;
const bind4 = (a, b, c, d, f) => {
    if (exports.isError(a))
        return a;
    if (exports.isError(b))
        return b;
    if (exports.isError(c))
        return c;
    if (exports.isError(d))
        return d;
    return f([a.value, b.value, c.value, d.value]);
};
exports.bind4 = bind4;
const bindWith = (res, f) => {
    if (exports.isError(res))
        return res;
    return exports.ok(f(res.value));
};
exports.bindWith = bindWith;
/**
 * maps an array of results to a result of unwrapped and mapped values
 * if at least one value is an Error, then the result is Error
 */
const mapResult = (as, f) => {
    const bs = [];
    for (const val of as) {
        if (exports.isError(val))
            return val;
        bs.push(f(val.value));
    }
    return exports.ok(bs);
};
exports.mapResult = mapResult;
const reduceResult = (as) => {
    return exports.mapResult(as, x => x);
};
exports.reduceResult = reduceResult;
const fold = (vals, f, initialValue) => {
    let acc = exports.ok(initialValue);
    vals.forEach((v, idx) => {
        if (exports.isError(acc))
            return acc;
        acc = f(acc.value, v, idx);
    });
    return acc;
};
exports.fold = fold;
/**
 * unwraps a successful result, throws an error otherwise
 */
const okOrThrow = (res) => {
    if (exports.isError(res)) {
        throw new Error(res.value);
    }
    return res.value;
};
exports.okOrThrow = okOrThrow;
const promiseOf = (res) => {
    if (exports.isOk(res)) {
        return Promise.resolve(res.value);
    }
    return Promise.reject(res.value);
};
exports.promiseOf = promiseOf;
