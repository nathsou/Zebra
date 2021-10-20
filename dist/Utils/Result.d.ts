/**
 * a type respresenting the result of a computation that can fail
 */
export declare type Result<T, E> = Ok<T> | Error<E>;
/**
 * Result variant used when everything is fine
 */
export declare type Ok<T> = {
    type: "ok";
    value: T;
};
/**
 * Result variant used when something went wrong
 */
export declare type Error<E> = {
    type: "error";
    value: E;
};
/**
 * constructs a successful result
 */
export declare const ok: <T>(value: T) => Ok<T>;
/**
 * construct an unsuccessfully result
 */
export declare const error: <E>(value: E) => Error<E>;
/**
 * checks wether res matches the  variant of Result
 */
export declare const isOk: <T, E>(res: Result<T, E>) => res is Ok<T>;
/**
* checks wether res matches the 'Error' variant of Result
*/
export declare const isError: <T, E>(res: Result<T, E>) => res is Error<E>;
/**
 * bind for the Result Monad
 */
export declare const bind: <A, B, E>(res: Result<A, E>, f: (val: A) => Result<B, E>) => Result<B, E>;
export declare const bind2: <A, B, T, E>(a: Result<A, E>, b: Result<B, E>, f: (val: [A, B]) => Result<T, E>) => Result<T, E>;
export declare const bind3: <A, B, C, T, E>(a: Result<A, E>, b: Result<B, E>, c: Result<C, E>, f: (val: [A, B, C]) => Result<T, E>) => Result<T, E>;
export declare const bind4: <A, B, C, D, T, E>(a: Result<A, E>, b: Result<B, E>, c: Result<C, E>, d: Result<D, E>, f: (val: [A, B, C, D]) => Result<T, E>) => Result<T, E>;
export declare const bindWith: <A, B, E>(res: Result<A, E>, f: (val: A) => B) => Result<B, E>;
/**
 * maps an array of results to a result of unwrapped and mapped values
 * if at least one value is an Error, then the result is Error
 */
export declare const mapResult: <A, B, E>(as: Result<A, E>[], f: (a: A) => B) => Result<B[], E>;
export declare const reduceResult: <T, E>(as: Result<T, E>[]) => Result<T[], E>;
export declare const fold: <T, A, E>(vals: T[], f: (acc: A, v: T, idx: number) => Result<A, E>, initialValue: A) => Result<A, E>;
/**
 * unwraps a successful result, throws an error otherwise
 */
export declare const okOrThrow: <T, E extends string>(res: Result<T, E>) => T;
export declare type Unit = '()';
export declare const promiseOf: <T>(res: Result<T, string>) => Promise<T>;
