import { Dict, dictGet, dictHas } from "../../Utils/Common.ts";
import { DecisionTree } from "../DecisionTrees/DecisionTree.ts";
import { PrimExpr } from "./PrimitiveExpr.ts";

export const substitutePrim = (e: PrimExpr, subst: Dict<PrimExpr>): PrimExpr => {
    switch (e.type) {
        case 'variable':
            if (dictHas(subst, e.name)) {
                return dictGet(subst, e.name);
            }

            return e;
        case 'app':
            return {
                type: 'app',
                lhs: substitutePrim(e.lhs, subst),
                rhs: substitutePrim(e.rhs, subst)
            };
        case 'binop':
            return {
                type: 'binop',
                operator: e.operator,
                left: substitutePrim(e.left, subst),
                right: substitutePrim(e.right, subst)
            };
        case 'constant':
            return e;
        case 'if_then_else':
            return {
                type: 'if_then_else',
                cond: substitutePrim(e.cond, subst),
                thenBranch: substitutePrim(e.thenBranch, subst),
                elseBranch: substitutePrim(e.elseBranch, subst)
            };
        case 'lambda':
            return {
                type: 'lambda',
                arg: e.arg,
                body: substitutePrim(e.body, subst)
            };
        case 'let_in':
            return {
                type: 'let_in',
                left: e.left,
                middle: substitutePrim(e.middle, subst),
                right: substitutePrim(e.right, subst)
            };
        case 'let_rec_in':
            return {
                type: 'let_rec_in',
                arg: e.arg,
                funName: e.funName,
                middle: substitutePrim(e.middle, subst),
                right: substitutePrim(e.right, subst)
            };
        case 'switch':
            return {
                type: 'switch',
                value: substitutePrim(e.value, subst),
                dt: substituteDecisionTree(e.dt, subst)
            };
        case 'tyconst':
            return {
                type: 'tyconst',
                name: e.name,
                args: e.args.map(a => substitutePrim(a, subst))
            };
        case 'subterm': return e;
    }
};

const substituteDecisionTree = (dt: DecisionTree, subst: Dict<PrimExpr>): DecisionTree => {
    if (dt.type === 'leaf') {
        return {
            type: 'leaf',
            action: substitutePrim(dt.action, subst)
        };
    }

    return dt;
};