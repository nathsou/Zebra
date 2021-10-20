/**
 * a type representing a value that might be empty
 */
export declare type Maybe<T> = T | undefined;
/**
 * checks wether opt is Some
 */
export declare const isSome: <T>(opt: Maybe<T>) => opt is T;
/**
 * checks wether opt is None
 */
export declare const isNone: <T>(opt: Maybe<T>) => opt is undefined;
/**
 * constructs an empty value
 */
export declare const None: undefined;
/**
 * constructs an inhabited value
 */
export declare const Some: <T>(x: T) => T;
/**
 * bind for the Maybe monad
 */
export declare const bind: <A, B>(m: Maybe<A>, f: (val: A) => B) => Maybe<B>;
export declare const mapOrDefault: <A, B>(m: Maybe<A>, f: (val: A) => B, default_: B) => B;
