import { CoreDecl } from "../../Core/CoreDecl.ts";
import { CoreExpr } from "../../Core/CoreExpr.ts";
import { showDecisionTree } from "../DecisionTrees/DecisionTree.ts";
import { clauseMatrixOf, compileClauseMatrix } from "../DecisionTrees/DecisionTreeCompiler.ts";
import { PrimDecl } from "./PrimitiveDecl.ts";
import { PrimExpr, PrimLambdaExpr } from "./PrimitiveExpr.ts";

export const primitiveDeclOfCoreDecl = (d: CoreDecl): PrimDecl => {
    switch (d.type) {
        case 'fun':
            return {
                type: 'fun',
                name: d.name,
                args: d.args,
                body: primitiveOf(d.body),
                curried: primitiveOf(d.curried) as PrimLambdaExpr
            };
        case 'datatype': return d;
    }
};

export const primitiveOf = (e: CoreExpr): PrimExpr => {
    switch (e.type) {
        case 'app':
            return {
                type: 'app',
                lhs: primitiveOf(e.lhs),
                rhs: primitiveOf(e.rhs)
            };
        case 'binop':
            return {
                type: 'binop',
                operator: e.operator,
                left: primitiveOf(e.left),
                right: primitiveOf(e.right)
            };
        case 'case_of': {
            const m = clauseMatrixOf(e);
            const dt = compileClauseMatrix(e.arity, m, new Set());
            return {
                type: 'switch',
                value: primitiveOf(e.value),
                dt
            };
        }
        case 'constant':
            return {
                type: 'constant',
                kind: e.kind,
                value: e.value
            };
        case 'if_then_else':
            return {
                type: 'if_then_else',
                cond: primitiveOf(e.cond),
                thenBranch: primitiveOf(e.thenBranch),
                elseBranch: primitiveOf(e.elseBranch)
            };
        case 'lambda':
            return {
                type: 'lambda',
                arg: e.arg,
                body: primitiveOf(e.body)
            };
        case 'let_in':
            return {
                type: 'let_in',
                left: e.left,
                middle: primitiveOf(e.middle),
                right: primitiveOf(e.right)
            };
        case 'let_rec_in':
            return {
                type: 'let_rec_in',
                arg: e.arg,
                funName: e.funName,
                middle: primitiveOf(e.middle),
                right: primitiveOf(e.right)
            };
        case 'tyconst':
            return {
                type: 'tyconst',
                name: e.name,
                args: e.args.map(primitiveOf)
            };
        case 'variable':
            return e;
    }
};

export const showPrim = (e: PrimExpr): string => {
    switch (e.type) {
        case 'app': return `(${showPrim(e.lhs)} ${showPrim(e.rhs)})`;
        case 'binop': return `${showPrim(e.left)} ${e.operator} ${showPrim(e.right)}`;
        case 'constant': return `${e.value}`;
        case 'if_then_else':
            return `if ${showPrim(e.cond)} then ${showPrim(e.thenBranch)} else ${showPrim(e.elseBranch)}`;
        case 'lambda': return `λ${e.arg} -> ${showPrim(e.body)}`;
        case 'let_in': return `let ${e.left} = ${showPrim(e.middle)} in ${showPrim(e.right)}`;
        case 'let_rec_in':
            return `let rec ${e.funName} ${e.arg} = ${showPrim(e.middle)} in ${showPrim(e.right)}`;
        case 'switch':
            return showDecisionTree(e.dt, e.value);
        case 'tyconst':
            if (e.args.length === 0) return e.name;
            if (e.name === 'tuple') return `(${e.args.map(showPrim).join(', ')})`;
            return `${e.name} ${e.args.map(showPrim).join(' ')}`;
        case 'variable': return e.name;
        case 'subterm':
            return e.pos.length === 0 ? `arg[${e.index}]` : `arg[${e.index}]|${e.pos.join('.')}`;
    }
};