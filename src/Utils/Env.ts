
export type Env<T> = { readonly [variable: string]: T };

export const emptyEnv = <T>(): Env<T> => ({});
export const envHas = <T>(env: Env<T>, x: string) => env[x] !== undefined;
export const envGet = <T>(env: Env<T>, x: string) => env[x];
export const envAdd = <T>(env: Env<T>, x: string, val: T): Env<T> => ({ ...env, [x]: val });
export const envSum = <T>(env1: Env<T>, env2: Env<T>): Env<T> => ({ ...env1, ...env2 });
export const envMap = <T, U>(env: Env<T>, f: (v: T) => U): Env<U> => {
    const env2: Record<string, U> = {};

    for (const [x, t] of Object.entries(env)) {
        env2[x] = f(t);
    }

    return env2;
};