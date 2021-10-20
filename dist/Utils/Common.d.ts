import { Maybe } from "./Maybe";
export declare const partition: <T>(vals: T[], pred: (v: T) => boolean) => [T[], T[]];
export declare const gen: <T>(count: number, f: (n: number) => T) => T[];
export declare const unreachable: (msg?: string) => never;
export declare type Dict<T> = {
    [key: string]: T;
};
export declare function dictSet<T>(dict: Dict<T>, key: string, value: T): Dict<T>;
export declare function dictHas<T>(dict: Dict<T>, key: string): boolean;
export declare function dictGet<T>(dict: Dict<T>, key: string): T;
export declare function dictEntries<T>(dict: Dict<T>): [string, T][];
export declare function dictValues<T>(dict: Dict<T>): T[];
export declare function dictKeys<T>(dict: Dict<T>): string[];
export declare function dictMap<T, U>(dict: Dict<T>, f: (val: T) => U): Dict<U>;
export declare function zip<T, U>(as: T[], bs: U[]): IterableIterator<[T, U]>;
export declare function some<T>(it: IterableIterator<T>, pred: (val: T) => boolean): boolean;
export declare function every<T>(it: IterableIterator<T>, pred: (val: T) => boolean): boolean;
export declare function indexed<T>(vals: T[]): IterableIterator<[T, number]>;
export declare function range(from: number, to: number, step?: number): IterableIterator<number>;
export declare function repeat<T>(val: T, count: number): IterableIterator<T>;
export declare function head<T>(list: T[]): T;
export declare function last<T>(list: T[]): T;
export declare function tail<T>(list: T[]): T[];
export declare function decons<T>(list: T[]): [T, T[]];
export declare type SetLike<T> = Set<T> | Map<T, unknown>;
export declare function setEq<T>(as: SetLike<T>, bs: SetLike<T>): boolean;
export declare function swapMut<T>(vals: T[], i: number, j: number): void;
export declare function swap<T>(vals: T[], i: number, j: number): T[];
export declare const deepCopy: <T extends Object>(obj: T) => any;
export declare const zipObject: <T>(keys: string[], values: T[]) => {
    [key: string]: T;
};
export declare const mapValues: <K, V, U>(m: Map<K, V>, f: (v: V, k: K) => U) => Map<K, U>;
export declare const defined: <T>(v: T | undefined) => T;
export declare const find: <T>(vals: T[], pred: (v: T) => boolean) => Maybe<T>;
export declare const sameElems: <T>(a: T[], b: T[]) => boolean;
export declare const mapOf: <T>(obj: {
    [key: string]: T;
}) => Map<string, T>;
export declare const cache: <T>(f: () => T) => () => T;
export declare const addSet: <T, K>(m: Map<K, Set<T>>, key: K, ...values: T[]) => void;
export declare function assert(test: boolean, message?: string): asserts test;