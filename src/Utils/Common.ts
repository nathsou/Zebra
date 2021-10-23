import { isNone, Maybe, None } from "./Maybe";

export const partition = <T>(vals: T[], pred: (v: T) => boolean): [T[], T[]] => {
  const as: T[] = [];
  const bs: T[] = [];

  for (const v of vals) {
    if (pred(v)) {
      as.push(v);
    } else {
      bs.push(v);
    }
  }

  return [as, bs];
};

export const gen = <T>(count: number, f: (n: number) => T): T[] => {
  const vals: T[] = [];

  for (let i = 0; i < count; i++) {
    vals.push(f(i));
  }

  return vals;
};

export const unreachable = (msg = ''): never => {
  throw Error(`Code marked as unreachable was reached: ${msg}`);
};

export type Dict<T> = { [key: string]: T };

export function dictSet<T>(dict: Dict<T>, key: string, value: T): Dict<T> {
  dict[key] = value;
  return dict;
}

export function dictHas<T>(dict: Dict<T>, key: string): boolean {
  // https://eslint.org/docs/rules/no-prototype-builtins
  return Object.prototype.hasOwnProperty.call(dict, key);
}

export function dictGet<T>(dict: Dict<T>, key: string): T {
  return dict[key];
}

export function dictEntries<T>(dict: Dict<T>): [string, T][] {
  return Object.entries(dict);
}

export function dictValues<T>(dict: Dict<T>): T[] {
  return Object.values(dict);
}

export function dictKeys<T>(dict: Dict<T>): string[] {
  return Object.keys(dict);
}

export function dictMap<T, U>(dict: Dict<T>, f: (val: T) => U): Dict<U> {
  const newDict: Dict<U> = {};
  for (const [key, val] of dictEntries(dict)) {
    dictSet(newDict, key, f(val));
  }

  return newDict;
}

export function* zip<T, U>(as: T[], bs: U[]): IterableIterator<[T, U]> {
  const len = Math.min(as.length, bs.length);

  for (let i = 0; i < len; i++) {
    yield [as[i], bs[i]];
  }
}

export function some<T>(it: IterableIterator<T>, pred: (val: T) => boolean): boolean {
  for (const val of it) {
    if (pred(val)) return true;
  }

  return false;
}

export function every<T>(it: IterableIterator<T>, pred: (val: T) => boolean): boolean {
  for (const val of it) {
    if (!pred(val)) return false;
  }

  return true;
}

export function* indexed<T>(vals: T[]): IterableIterator<[T, number]> {
  let i = 0;
  for (const val of vals) {
    yield [val, i++];
  }
}

export function* range(from: number, to: number, step = 1): IterableIterator<number> {
  for (let i = from; i < to; i += step) {
    yield i;
  }
}

export function* repeat<T>(val: T, count: number): IterableIterator<T> {
  for (let i = 0; i < count; i++) {
    yield val;
  }
}

export function head<T>(list: T[]): T {
  return list[0];
}

export function last<T>(list: T[]): T {
  return list[list.length - 1];
}

export function tail<T>(list: T[]): T[] {
  return list.slice(1);
}

export function decons<T>(list: T[]): [T, T[]] {
  return [head(list), tail(list)];
}

export type SetLike<T> = Set<T> | Map<T, unknown>;

export function setEq<T>(as: SetLike<T>, bs: SetLike<T>): boolean {
  return as.size === bs.size && !some(as.keys(), a => !bs.has(a));
}

export function swapMut<T>(vals: T[], i: number, j: number): void {
  if (i < 0 || j < 0 || i >= vals.length || j >= vals.length) {
    throw new Error(`invalid swap indices, len: ${vals.length}, i: ${i}, j: ${j}`);
  }

  const tmp = vals[i];
  vals[i] = vals[j];
  vals[j] = tmp;
}

export function swap<T>(vals: T[], i: number, j: number): T[] {
  const copy = [...vals];
  swapMut(copy, i, j);
  return copy;
}

export const deepCopy = <T extends Object>(obj: T) => {
  return JSON.parse(JSON.stringify(obj));
};

export const zipObject = <T>(keys: string[], values: T[]): { [key: string]: T } => {
  const obj: { [key: string]: T } = {};

  for (const [key, value] of zip(keys, values)) {
    obj[key] = value;
  }

  return obj;
};

export const mapValues = <K, V, U>(m: Map<K, V>, f: (v: V, k: K) => U): Map<K, U> => {
  const m2 = new Map<K, U>();

  for (const [k, v] of m) {
    m2.set(k, f(v, k));
  }

  return m2;
};

// use only when we know for sure that a value is defined
export const defined = <T>(v: T | undefined): T => {
  if (v === undefined) {
    throw new Error(`called 'defined' on an undefined value`);
  } else {
    return v;
  }
};

export const find = <T>(vals: T[], pred: (v: T) => boolean): Maybe<T> => {
  for (const v of vals) {
    if (pred(v)) return v;
  }

  return None;
};

export const sameElems = <T>(a: T[], b: T[]): boolean => {
  if (a.length !== b.length) return false;

  const aSet = new Set(a);
  const bSet = new Set(b);

  for (const s of aSet) {
    if (!bSet.has(s)) return false;
  }

  return true;
};

export const mapOf = <T>(obj: { [key: string]: T }): Map<string, T> => {
  return new Map(Object.entries(obj));
};

export const cache = <T>(f: () => T): () => T => {
  let cachedVal: Maybe<T> = None;

  return () => {
    if (isNone(cachedVal)) {
      cachedVal = f();
    }

    return cachedVal;
  };
};

export const addSet = <T, K>(m: Map<K, Set<T>>, key: K, ...values: T[]): void => {
  if (!m.has(key)) {
    m.set(key, new Set());
  }

  for (const v of values) {
    m.get(key)?.add(v);
  }
};

export function assert(test: boolean, message = ''): asserts test {
  if (!test) {
    throw new Error(`assertion failed: ${message}`);
  }
}