/**
 * a type respresenting the result of a computation that can fail
 */
export type Result<T, E> = Ok<T> | Error<E>;

/**
 * Result variant used when everything is fine
 */
export type Ok<T> = { type: "ok", value: T };

/**
 * Result variant used when something went wrong
 */
export type Error<E> = { type: "error", value: E };

/**
 * constructs a successful result
 */
export const ok = <T>(value: T): Ok<T> => ({ type: "ok", value });

/**
 * construct an unsuccessfully result 
 */
export const error = <E>(value: E): Error<E> => ({
    type: "error",
    value
});

/**
 * checks wether res matches the 'Ok' variant of Result
 */
export const isOk = <T, E>(res: Result<T, E>): res is Ok<T> =>
    res.type === "ok";

/**
* checks wether res matches the 'Error' variant of Result
*/
export const isError = <T, E>(res: Result<T, E>): res is Error<E> =>
    res.type === "error";


/**
 * bind for the Result Monad
 */
export const bind = <A, B, E>(res: Result<A, E>, f: (val: A) => Result<B, E>): Result<B, E> => {
    if (isError(res)) return res;
    return f(res.value);
};

/**
 * maps an array of results to a result of unwrapped and mapped values
 * if at least one value is an Error, then the result is Error
 */
export const mapResult = <A, B, E>(as: Result<A, E>[], f: (a: A) => B): Result<B[], E> => {
    const bs: B[] = [];

    for (const val of as) {
        if (isError(val)) return val;
        bs.push(f(val.value));
    }

    return ok(bs);
};

/**
 * unwraps a successful result, throws an error otherwise
 */
export const okOrThrow = <T, E extends string>(res: Result<T, E>): T => {
    if (isError(res)) {
        throw new Error(res.value);
    }

    return res.value;
};