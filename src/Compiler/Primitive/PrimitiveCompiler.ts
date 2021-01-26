import { CoreDecl } from "../../Core/CoreDecl.ts";
import { CoreExpr } from "../../Core/CoreExpr.ts";
import { casifyFunctionDeclarations } from "../../Core/Casify.ts";
import { Decl } from "../../Parser/Decl.ts";
import { gen } from "../../Utils/Common.ts";
import { showDecisionTree } from "../DecisionTrees/DecisionTree.ts";
import { clauseMatrixOf, compileClauseMatrix } from "../DecisionTrees/DecisionTreeCompiler.ts";
import { PrimDecl } from "./PrimitiveDecl.ts";
import { PrimExpr } from "./PrimitiveExpr.ts";
import { isSome, Maybe } from "../../Utils/Maybe.ts";

export const primitiveProgramOfCore = (coreProg: CoreDecl[]): PrimDecl[] => {
    const decls: PrimDecl[] = [];

    for (const decl of coreProg) {
        const prim = primitiveDeclOfCoreDecl(decl);
        if (isSome(prim)) {
            decls.push(...prim);
        }
    }

    return decls;
};

export const primitiveProgramOf = (prog: Decl[]): PrimDecl[] => {
    return primitiveProgramOfCore(casifyFunctionDeclarations(prog));
};

const primitiveDeclOfCoreDecl = (d: CoreDecl): Maybe<PrimDecl[]> => {
    switch (d.type) {
        case 'fun':
            return [{
                type: 'fun',
                name: d.funName.name,
                args: d.args.map(a => a.name),
                body: primitiveOf(d.body)
            }];
        case 'datatype':
            const vs = d.variants.map(v => {
                const args = gen(v.args.length, n => `v${n}`);
                const val: PrimExpr = {
                    type: 'tyconst',
                    name: v.name,
                    args: args.map(x => ({ type: 'variable', name: x }))
                };

                return {
                    type: 'fun',
                    name: v.name,
                    args,
                    body: val
                } as const;
            });

            return vs;

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
            return e;
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
                arg: e.arg.name,
                body: primitiveOf(e.body)
            };
        case 'let_in':
            return {
                type: 'let_in',
                left: e.left.name,
                middle: primitiveOf(e.middle),
                right: primitiveOf(e.right)
            };
        case 'let_rec_in':
            return {
                type: 'let_rec_in',
                arg: e.arg.name,
                funName: e.funName.name,
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