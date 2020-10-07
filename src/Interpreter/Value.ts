import { Expr, showExpr } from "../Parser/Expr.ts";
import { Env } from "../Utils/Env.ts";

export type ValEnv = Env<Value>;

export type Value = ConstantVal | ClosureVal | TyConstVal | RecVarVal;

export type ConstantVal = IntegerVal;

export type IntegerVal = { type: 'int', value: number };

// Type constructor, constructor
export const ty = (name: string, ...args: Value[]): TyConstVal => {
    return { type: 'tyconst', name, args };
};

export type TyConstVal = { type: 'tyconst', name: string, args: Value[] };

export type ClosureVal = {
    type: 'closure',
    arg: string,
    body: Expr,
    env: ValEnv
};

export type RecVarVal = {
    type: 'recvar',
    name: string,
    arg: string,
    body: Expr,
    env: Env<Value>
};

export const valuesEq = (a: Value, b: Value): boolean => {
    if (a.type !== b.type) return false;

    switch (a.type) {
        case 'int':
            return a.value === (b as IntegerVal).value;
        case 'closure':
            return false;
        case 'recvar':
            return false;
        case 'tyconst':
            return a.type === (b as TyConstVal).name &&
                a.args.length === (b as TyConstVal).args.length &&
                a.args.every((s, i) => valuesEq(s, (b as TyConstVal).args[i]));
    }
};

export type ValueTypeMap = {
    'int': IntegerVal,
    'closure': ClosureVal,
    'tyconst': TyConstVal,
    'recvar': RecVarVal
};

export const showValue = (val: Value): string => {
    switch (val.type) {
        case 'int':
            return val.value.toString();
        case 'closure':
            return `λ${val.arg} -> ${showExpr(val.body)}`;
        case 'tyconst':
            if (val.args.length === 0) {
                return val.name;
            } else {
                return `(${val.name} ${val.args.join(' ')})`;
            }
        case 'recvar':
            return `rec λ${val.arg} -> ${showExpr(val.body)}`;
    }
};

export const showValEnv = (env: ValEnv): string => {
    return `{ ${Object.entries(env).map(([x, val]) => `${x} = ${showValue(val)}`).join(', ')} }`;
};