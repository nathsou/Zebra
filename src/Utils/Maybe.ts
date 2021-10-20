/**
 * a type representing a value that might be empty
 */
export type Maybe<T> = T | undefined;

/**
 * checks wether opt is Some
 */
export const isSome = <T>(opt: Maybe<T>): opt is T => {
  return opt !== undefined;
};

/**
 * checks wether opt is None
 */
export const isNone = <T>(opt: Maybe<T>): opt is undefined => {
  return opt === undefined;
};

/**
 * constructs an empty value
 */
export const None = undefined;

/**
 * constructs an inhabited value
 */
export const Some = <T>(x: T): T => x;

/**
 * bind for the Maybe monad
 */
export const bind = <A, B>(m: Maybe<A>, f: (val: A) => B): Maybe<B> => {
  if (isNone(m)) return None;
  return f(m);
};

export const mapOrDefault = <A, B>(
  m: Maybe<A>,
  f: (val: A) => B,
  default_: B
): B => {
  if (isSome(m)) return f(m);
  return default_;
};