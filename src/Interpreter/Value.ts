import { CoreExpr } from "../Core/CoreExpr.ts";
import { showExpr } from "../Parser/Expr.ts";
import { showList } from "../Parser/Sugar.ts";
import { Env } from "../Utils/Env.ts";
import { showPattern } from "./Pattern.ts";

export type ValEnv = Env<Value>;

export type Value = ConstantVal | ClosureVal | TyConstVal | RecVarVal;

export type ConstantVal = IntegerVal | CharVal;

export type IntegerVal = { type: 'int', value: number };

export type CharVal = { type: 'char', value: string };

// Type constructor, constructor
export const ty = (name: string, ...args: Value[]): TyConstVal => {
    return { type: 'tyconst', name, args };
};

export type TyConstVal = { type: 'tyconst', name: string, args: Value[] };

export type ClosureVal = {
    type: 'closure',
    arg: string,
    body: CoreExpr,
    env: ValEnv
};

export type RecVarVal = {
    type: 'recvar',
    name: string,
    arg: string,
    body: CoreExpr,
    env: Env<Value>
};

export const valuesEq = (a: Value, b: Value): boolean => {
    if (a.type !== b.type) return false;

    switch (a.type) {
        case 'int':
            return a.value === (b as IntegerVal).value;
        case 'char':
            return a.value === (b as CharVal).value;
        case 'closure':
            return false;
        case 'recvar':
            return false;
        case 'tyconst':
            return a.name === (b as TyConstVal).name &&
                a.args.length === (b as TyConstVal).args.length &&
                a.args.every((s, i) => valuesEq(s, (b as TyConstVal).args[i]));
    }
};

export type ValueTypeMap = {
    'int': IntegerVal,
    'char': CharVal,
    'closure': ClosureVal,
    'tyconst': TyConstVal,
    'recvar': RecVarVal
};

export const showValue = (val: Value): string => {
    switch (val.type) {
        case 'int':
            return val.value.toString();
        case 'char':
            return `'${val.value}'`;
        case 'closure':
            return `λ${showPattern(val.arg)} -> ${showExpr(val.body)}`;
        case 'tyconst':

            switch (val.name) {
                case 'tuple':
                    return `(${val.args.map(showValue).join(', ')})`;
                case 'Nil':
                    return '[]';
                case 'Cons':
                    return showList(val);
            }

            if (val.args.length === 0) {
                return val.name;
            } else {
                return `(${val.name} ${val.args.map(showValue).join(' ')})`;
            }
        case 'recvar':
            return `rec λ${val.arg} -> ${showExpr(val.body)}`;
    }
};

export const showValEnv = (env: ValEnv): string => {
    return `{ ${Object.entries(env).map(([x, val]) => `${x} = ${showValue(val)}`).join(', ')} }`;
};