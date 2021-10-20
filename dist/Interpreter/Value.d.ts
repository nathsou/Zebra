import { CoreExpr } from "../Core/CoreExpr";
import { Env } from "../Utils/Env";
export declare type ValEnv = Env<Value>;
export declare type Value = ConstantVal | ClosureVal | TyConstVal | RecVarVal | PrimitiveFuncVal;
export declare type ConstantVal = IntegerVal | FloatVal | CharVal;
export declare type IntegerVal = {
    type: 'int';
    value: number;
};
export declare type FloatVal = {
    type: 'float';
    value: number;
};
export declare type CharVal = {
    type: 'char';
    value: string;
};
export declare const ty: (name: string, ...args: Value[]) => TyConstVal;
export declare type TyConstVal = {
    type: 'tyconst';
    name: string;
    args: Value[];
};
export declare type ClosureVal = {
    type: 'closure';
    arg: string;
    body: CoreExpr;
    env: ValEnv;
};
export declare type RecVarVal = {
    type: 'recvar';
    name: string;
    arg: string;
    body: CoreExpr;
    env: Env<Value>;
};
export declare type PrimitiveFuncVal = {
    type: 'primitive_func';
    body: (a: Value) => Value;
};
export declare const valuesEq: (a: Value, b: Value) => boolean;
export declare type ValueTypeMap = {
    'int': IntegerVal;
    'char': CharVal;
    'closure': ClosureVal;
    'tyconst': TyConstVal;
    'recvar': RecVarVal;
};
export declare const showValue: (val: Value) => string;
export declare const showList: (lst: TyConstVal) => string;
export declare const showValEnv: (env: ValEnv) => string;
