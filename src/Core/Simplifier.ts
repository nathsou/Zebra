import { assert } from "https://deno.land/std@0.73.0/testing/asserts.ts";
import { isVar } from "../Interpreter/Pattern.ts";
import { Decl, FuncDecl } from "../Parser/Decl.ts";
import { CaseOfExpr, Expr } from "../Parser/Expr.ts";
import { lambdaOf } from "../Parser/Sugar.ts";
import { gen } from "../Utils/Common.ts";
import { CoreDecl, CoreFuncDecl } from "./CoreDecl.ts";
import { CoreCaseOfExpr, CoreExpr, CoreLambdaExpr, CoreTyConstExpr } from "./CoreExpr.ts";

export const casifyFunctionDeclarations = (prog: Decl[]): CoreDecl[] => {
    const funs: FuncDecl[] = [];

    const core: CoreDecl[] = [];

    for (const decl of prog) {
        switch (decl.type) {
            case 'fun':
                funs.push(decl);
                break;
            case 'datatype':
                core.push(decl);
                break;
        }
    }

    const grouped = groupByHead(funs);

    for (const [name, funs] of grouped) {
        core.push(reducePatternMatchingToCaseOf(casify(name, funs)));
    }

    return core;
};

const reducePatternMatchingToCaseOf = (fun: FuncDecl): CoreFuncDecl => {
    if (fun.args.every(isVar)) {
        return {
            type: 'fun',
            name: fun.name,
            args: fun.args as string[],
            body: coreOf(fun.body),
            curried: coreOf(fun.curried) as CoreLambdaExpr
        };
    } else {
        // f p1 p2 ... pn = body
        // -->
        // f x1 x2 ... xn = case (x1, x2, ..., xn) of (p1, p2, ..., pn) -> body

        const arity = fun.args.length;
        const args = gen(arity, n => `x${n}`);

        const testedVal: CoreExpr = arity === 1 ?
            { type: 'variable', name: args[0] } :
            tupleOf(args.map(x => ({ type: 'variable', name: x })));

        const caseOf: CoreCaseOfExpr = {
            type: 'case_of',
            value: testedVal,
            arity,
            cases: [{
                pattern: arity === 1 ? fun.args[0] : { name: 'tuple', args: fun.args },
                expr: coreOf(fun.body)
            }]
        };

        return {
            type: 'fun',
            name: fun.name,
            args,
            body: caseOf,
            curried: coreOf(lambdaOf(args, caseOf)) as CoreLambdaExpr
        };
    }
};

/**
 * reduces pattern matching variants of let in, lambda, let rec in expression
 * to core expressions using case of
 */
export const coreOf = (e: Expr): CoreExpr => {
    switch (e.type) {
        case 'lambda': {
            const x = e.arg;
            if (isVar(x)) {
                return {
                    type: 'lambda',
                    arg: x,
                    body: coreOf(e.body)
                };
            } else {
                // \pat -> e
                // -->
                // \x -> case x of pat -> e
                return {
                    type: 'lambda',
                    arg: 'x',
                    body: {
                        type: 'case_of',
                        arity: 1,
                        value: { type: 'variable', name: 'x' },
                        cases: [{
                            pattern: e.arg,
                            expr: coreOf(e.body)
                        }]
                    }
                };
            }
        }
        case 'let_in': {
            const x = e.left;
            if (isVar(x)) {
                return {
                    type: 'let_in',
                    left: x,
                    middle: coreOf(e.middle),
                    right: coreOf(e.right)
                };
            } else {
                // let pat = val in e
                // -->
                // case val of pat -> e
                return {
                    type: 'case_of',
                    value: coreOf(e.middle),
                    arity: 1,
                    cases: [{
                        pattern: e.left,
                        expr: coreOf(e.right)
                    }]
                };
            }
        }
        case 'let_rec_in': {
            const x = e.arg;
            if (isVar(x)) {
                return {
                    type: 'let_rec_in',
                    arg: x,
                    funName: e.funName,
                    middle: coreOf(e.middle),
                    right: coreOf(e.right)
                };
            } else {
                // let rec f pat = val in e
                // -->
                // let rec f x = case x of pat -> val in e
                return {
                    type: 'let_rec_in',
                    arg: 'x',
                    funName: e.funName,
                    right: coreOf(e.right),
                    middle: {
                        type: 'case_of',
                        value: { type: 'variable', name: 'x' },
                        arity: 1,
                        cases: [{
                            pattern: e.arg,
                            expr: coreOf(e.middle)
                        }]
                    }
                };
            }
        }
        case 'case_of': {
            return {
                type: 'case_of',
                value: coreOf(e.value),
                arity: e.arity,
                cases: e.cases.map(c => ({ pattern: c.pattern, expr: coreOf(c.expr) }))
            };
        }
        case 'tyconst': {
            return {
                type: 'tyconst',
                name: e.name,
                args: e.args.map(coreOf)
            };
        }
        case 'binop': {
            return {
                type: 'binop',
                operator: e.operator,
                left: coreOf(e.left),
                right: coreOf(e.right)
            };
        }
        case 'if_then_else': {
            return {
                type: 'if_then_else',
                cond: coreOf(e.cond),
                thenBranch: coreOf(e.thenBranch),
                elseBranch: coreOf(e.elseBranch)
            };
        }
        case 'app': {
            return {
                type: 'app',
                lhs: coreOf(e.lhs),
                rhs: coreOf(e.rhs)
            };
        }
    }

    return e;
};

const tupleOf = (vals: CoreExpr[]): CoreTyConstExpr => {
    return {
        type: 'tyconst',
        name: 'tuple',
        args: vals
    };
};

const casify = (name: string, funs: FuncDecl[]): FuncDecl => {
    if (funs.length === 1) return funs[0];

    const arity = funs[0].args.length;

    // check that arity is consistent
    assert(funs.every(f => f.args.length === arity));

    const args = gen(arity, n => `x${n}`);

    const testedVal: Expr = arity === 1 ?
        { type: 'variable', name: args[0] } :
        tupleOf(args.map(x => ({ type: 'variable', name: x })));

    const caseOf: CaseOfExpr = {
        type: 'case_of',
        value: testedVal,
        arity,
        cases: funs.map(f => ({
            pattern: f.args.length === 1 ? f.args[0] : { name: 'tuple', args: f.args },
            expr: f.body
        }))
    };

    return {
        type: 'fun',
        name,
        args,
        body: caseOf,
        curried: lambdaOf(args, caseOf)
    };
};

const groupByHead = (funs: FuncDecl[]): Map<string, FuncDecl[]> => {
    const grouped = new Map<string, FuncDecl[]>();

    for (const f of funs) {
        if (!grouped.has(f.name)) {
            grouped.set(f.name, []);
        }

        grouped.get(f.name)?.push(f);
    }

    return grouped;
};