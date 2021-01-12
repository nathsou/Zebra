import { Dict } from "../../Utils/Common.ts";
import { showPrim } from "../Primitive/PrimitiveCompiler.ts";
import { PrimExpr, PrimSubtermOccurence, PrimTyConstExpr } from "../Primitive/PrimitiveExpr.ts";
import { AnyPat, IndexedOccurence } from "./DecisionTreeCompiler.ts";

export type Leaf = { type: 'leaf', action: PrimExpr, bindings: Dict<PrimSubtermOccurence> };
export type Fail = { type: 'fail' };

export type Switch = {
    type: 'switch',
    occurence: IndexedOccurence,
    tests: Array<[string | AnyPat, DecisionTree]>
};

export type DecisionTree = Leaf | Fail | Switch;

export const makeFail = (): Fail => ({ type: 'fail' });
export const makeLeaf = (
    action: PrimExpr,
    bindings: Dict<PrimSubtermOccurence>
): Leaf => ({ type: 'leaf', action, bindings });

export const makeSwitch = (
    occurence: IndexedOccurence,
    tests: Switch['tests']
): Switch => {
    return {
        type: 'switch',
        occurence,
        tests
    };
};

export const getOccurence = (args: PrimExpr[], occurence: IndexedOccurence): PrimExpr => {
    let v = args[occurence.index];

    for (const idx of occurence.pos) {
        v = (v as PrimTyConstExpr).args[idx];
    }

    return v;
};

export const showDecisionTree = (dt: DecisionTree, arg: PrimExpr): string => {
    switch (dt.type) {
        case 'leaf':
            return showPrim(dt.action);
        case 'fail':
            return `fail`;
        case 'switch':
            const cases = dt.tests.map(([ctor, subtree]) => {
                return `${ctor} -> ${showDecisionTree(subtree, arg)}`;
            }).join('\n');

            return `switch ${showPrim(arg)} ${JSON.stringify(dt.occurence)} {\n ${cases} \n}`;
    }
};