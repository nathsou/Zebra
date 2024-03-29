import { isError, ok, Result } from "./Result";

export type Env<T> = { readonly [variable: string]: T };

export const emptyEnv = <T>(): Env<T> => ({});
export const envHas = <T>(env: Env<T>, x: string) => env[x] !== undefined;
export const envGet = <T>(env: Env<T>, x: string) => env[x];
export const envAdd = <T>(env: Env<T>, x: string, val: T): Env<T> => ({ ...env, [x]: val });
export const envAddMut = <T>(env: Env<T>, x: string, val: T): Env<T> => {
  (env as any)[x] = val;
  return env;
};

export const envRem = <T>(env: Env<T>, x: string): Env<T> => {
  const cpy = { ...env };
  delete cpy[x];
  return cpy;
};

export const envSum = <T>(env1: Env<T>, env2: Env<T>): Env<T> => ({ ...env1, ...env2 });
export const envMap = <T, U>(env: Env<T>, f: (v: T) => U): Env<U> => {
  const env2: Record<string, U> = {};

  for (const [x, t] of Object.entries(env)) {
    env2[x] = f(t);
  }

  return env2;
};

export const envMapRes = <T, U, E>(env: Env<T>, f: (v: T) => Result<U, E>): Result<Env<U>, E> => {
  const env2: Record<string, U> = {};

  for (const [x, t] of Object.entries(env)) {
    const res = f(t);
    if (isError(res)) return res;
    env2[x] = res.value;
  }

  return ok(env2);
};