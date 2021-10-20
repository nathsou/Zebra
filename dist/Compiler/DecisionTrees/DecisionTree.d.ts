import { Dict } from "../../Utils/Common";
import { PrimExpr, PrimSubtermOccurence } from "../Primitive/PrimitiveExpr";
import { AnyPat, IndexedOccurence } from "./DecisionTreeCompiler";
export declare type Leaf = {
    type: 'leaf';
    action: PrimExpr;
    bindings: Dict<PrimSubtermOccurence>;
};
export declare type Fail = {
    type: 'fail';
};
export declare type Switch = {
    type: 'switch';
    occurence: IndexedOccurence;
    tests: Array<[string | AnyPat, DecisionTree]>;
};
export declare type DecisionTree = Leaf | Fail | Switch;
export declare const makeFail: () => Fail;
export declare const makeLeaf: (action: PrimExpr, bindings: Dict<PrimSubtermOccurence>) => Leaf;
export declare const makeSwitch: (occurence: IndexedOccurence, tests: Switch['tests']) => Switch;
export declare const getOccurence: (args: PrimExpr[], occurence: IndexedOccurence) => PrimExpr;
export declare const showDecisionTree: (dt: DecisionTree, arg: PrimExpr) => string;
