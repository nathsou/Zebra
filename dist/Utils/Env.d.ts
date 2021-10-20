import { Result } from "./Result";
export declare type Env<T> = {
    readonly [variable: string]: T;
};
export declare const emptyEnv: <T>() => Env<T>;
export declare const envHas: <T>(env: Env<T>, x: string) => boolean;
export declare const envGet: <T>(env: Env<T>, x: string) => T;
export declare const envAdd: <T>(env: Env<T>, x: string, val: T) => Env<T>;
export declare const envAddMut: <T>(env: Env<T>, x: string, val: T) => Env<T>;
export declare const envRem: <T>(env: Env<T>, x: string) => Env<T>;
export declare const envSum: <T>(env1: Env<T>, env2: Env<T>) => Env<T>;
export declare const envMap: <T, U>(env: Env<T>, f: (v: T) => U) => Env<U>;
export declare const envMapRes: <T, U, E>(env: Env<T>, f: (v: T) => Result<U, E>) => Result<Env<U>, E>;
