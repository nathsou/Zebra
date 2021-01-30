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
 * checks wether res matches the  variant of Result
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

export const bind2 = <A, B, T, E>(
    a: Result<A, E>,
    b: Result<B, E>,
    f: (val: [A, B]) => Result<T, E>
): Result<T, E> => {
    if (isError(a)) return a;
    if (isError(b)) return b;
    return f([a.value, b.value]);
};

export const bind3 = <A, B, C, T, E>(
    a: Result<A, E>,
    b: Result<B, E>,
    c: Result<C, E>,
    f: (val: [A, B, C]) => Result<T, E>
): Result<T, E> => {
    if (isError(a)) return a;
    if (isError(b)) return b;
    if (isError(c)) return c;
    return f([a.value, b.value, c.value]);
};

export const bind4 = <A, B, C, D, T, E>(
    a: Result<A, E>,
    b: Result<B, E>,
    c: Result<C, E>,
    d: Result<D, E>,
    f: (val: [A, B, C, D]) => Result<T, E>
): Result<T, E> => {
    if (isError(a)) return a;
    if (isError(b)) return b;
    if (isError(c)) return c;
    if (isError(d)) return d;
    return f([a.value, b.value, c.value, d.value]);
};

export const bindWith = <A, B, E>(res: Result<A, E>, f: (val: A) => B): Result<B, E> => {
    if (isError(res)) return res;
    return ok(f(res.value));
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

export const reduceResult = <T, E>(as: Result<T, E>[]): Result<T[], E> => {
    return mapResult(as, x => x);
};

export const fold = <T, A, E>(
    vals: T[],
    f: (acc: A, v: T, idx: number) => Result<A, E>,
    initialValue: A
): Result<A, E> => {
    let acc: Result<A, E> = ok(initialValue);

    vals.forEach((v, idx) => {
        if (isError(acc)) return acc;
        acc = f(acc.value, v, idx);
    });

    return acc;
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

export type Unit = '()';

export const promiseOf = <T>(res: Result<T, string>): Promise<T> => {
    if (isOk(res)) {
        return Promise.resolve(res.value);
    }

    return Promise.reject(res.value);
};