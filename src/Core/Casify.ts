import { assert } from "https://deno.land/std@0.83.0/testing/asserts.ts";
import { isVar, patVarOfVar, varOfPatVar } from "../Interpreter/Pattern.ts";
import { FuncDecl } from "../Parser/Decl.ts";
import { CaseOfExpr, Expr, TyConstExpr, varOf } from "../Parser/Expr.ts";
import { gen, mapValues } from "../Utils/Common.ts";
import { CoreFuncDecl } from "./CoreDecl.ts";
import { CoreCaseOfExpr, CoreExpr, CoreTyConstExpr } from "./CoreExpr.ts";

export const casifyFunctionDeclarations = (funcs: Map<string, FuncDecl[]>): Map<string, CoreFuncDecl> => {
    return mapValues(
        funcs,
        (defs, name) => reducePatternMatchingToCaseOf(casify(name, defs))
    );
};

export const reducePatternMatchingToCaseOf = (fun: FuncDecl): CoreFuncDecl => {
    if (fun.args.every(isVar)) {
        return {
            type: 'fun',
            funName: fun.funName,
            args: fun.args.map(varOfPatVar),
            body: coreOf(fun.body)
        };
    } else {
        // f p1 p2 ... pn = body
        // -->
        // f x1 x2 ... xn = case (x1, x2, ..., xn) of (p1, p2, ..., pn) -> body

        const arity = fun.args.length;
        const args = gen(arity, n => varOf(`x${n}`));

        const testedVal: CoreExpr = arity === 1 ?
            args[0] :
            coreTupleOf(args);

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
            funName: fun.funName,
            args,
            body: caseOf
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
                    arg: varOfPatVar(x),
                    body: coreOf(e.body)
                };
            } else {
                // \pat -> e
                // -->
                // \x -> case x of pat -> e

                const x = varOf('x');
                return {
                    type: 'lambda',
                    arg: x,
                    body: {
                        type: 'case_of',
                        arity: 1,
                        value: x,
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
                    left: varOfPatVar(x),
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
                    arg: varOfPatVar(x),
                    funName: e.funName,
                    middle: coreOf(e.middle),
                    right: coreOf(e.right)
                };
            } else {
                // let rec f pat = val in e
                // -->
                // let rec f x = case x of pat -> val in e

                const x = varOf('x');
                return {
                    type: 'let_rec_in',
                    arg: x,
                    funName: e.funName,
                    right: coreOf(e.right),
                    middle: {
                        type: 'case_of',
                        value: x,
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
                cases: e.cases.map(c => ({
                    pattern: c.pattern,
                    expr: coreOf(c.expr)
                }))
            };
        }
        case 'tyconst': {
            return {
                type: 'tyconst',
                name: e.name,
                args: e.args.map(coreOf)
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
        case 'constant': {
            return e;
        }
    }

    return e;
};

const coreTupleOf = (vals: CoreExpr[]): CoreTyConstExpr => {
    return {
        type: 'tyconst',
        name: 'tuple',
        args: vals
    };
};

const tupleOf = (vals: Expr[]): TyConstExpr => {
    return {
        type: 'tyconst',
        name: 'tuple',
        args: vals
    };
};

export const casify = (name: string, funs: FuncDecl[]): FuncDecl => {
    if (funs.length === 1) return funs[0];

    const arity = funs[0].args.length;

    // check that arity is consistent
    assert(
        funs.every(f => f.args.length === arity),
        `inconsistent arities for '${name}', expected ${arity} arguments`
    );

    // each definition can name arguments differently
    const renamedArgs = gen(arity, n => varOf(`x${n}`));

    const testedVal: Expr = arity === 1 ?
        renamedArgs[0] :
        tupleOf(renamedArgs);

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
        funName: funs[0].funName,
        args: renamedArgs.map(patVarOfVar),
        body: caseOf
    };
};

export const groupByHead = (funs: FuncDecl[]): Map<string, FuncDecl[]> => {
    const grouped = new Map<string, FuncDecl[]>();

    for (const f of funs) {
        if (!grouped.has(f.funName.name)) {
            grouped.set(f.funName.name, []);
        }

        grouped.get(f.funName.name)?.push(f);
    }

    return grouped;
};