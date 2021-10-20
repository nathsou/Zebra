"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapOrDefault = exports.bind = exports.Some = exports.None = exports.isNone = exports.isSome = void 0;
/**
 * checks wether opt is Some
 */
const isSome = (opt) => {
    return opt !== undefined;
};
exports.isSome = isSome;
/**
 * checks wether opt is None
 */
const isNone = (opt) => {
    return opt === undefined;
};
exports.isNone = isNone;
/**
 * constructs an empty value
 */
exports.None = undefined;
/**
 * constructs an inhabited value
 */
const Some = (x) => x;
exports.Some = Some;
/**
 * bind for the Maybe monad
 */
const bind = (m, f) => {
    if (exports.isNone(m))
        return exports.None;
    return f(m);
};
exports.bind = bind;
const mapOrDefault = (m, f, default_) => {
    if (exports.isSome(m))
        return f(m);
    return default_;
};
exports.mapOrDefault = mapOrDefault;
