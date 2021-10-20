"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.groupByHead = exports.casify = exports.coreOf = exports.reducePatternMatchingToCaseOf = exports.casifyFunctionDeclarations = void 0;
const Pattern_1 = require("../Interpreter/Pattern");
const Expr_1 = require("../Parser/Expr");
const Common_1 = require("../Utils/Common");
const casifyFunctionDeclarations = (funcs) => {
    return Common_1.mapValues(funcs, (defs, name) => exports.reducePatternMatchingToCaseOf(exports.casify(name, defs)));
};
exports.casifyFunctionDeclarations = casifyFunctionDeclarations;
const reducePatternMatchingToCaseOf = (fun) => {
    if (fun.args.every(Pattern_1.isVar)) {
        return {
            type: 'fun',
            funName: fun.funName,
            args: fun.args.map(Pattern_1.varOfPatVar),
            body: exports.coreOf(fun.body)
        };
    }
    else {
        // f p1 p2 ... pn = body
        // -->
        // f x1 x2 ... xn = case (x1, x2, ..., xn) of (p1, p2, ..., pn) -> body
        const arity = fun.args.length;
        const args = Common_1.gen(arity, n => Expr_1.varOf(`x${n}`));
        const testedVal = arity === 1 ?
            args[0] :
            coreTupleOf(args);
        const caseOf = {
            type: 'case_of',
            value: testedVal,
            arity,
            cases: [{
                    pattern: arity === 1 ? fun.args[0] : { name: 'tuple', args: fun.args },
                    expr: exports.coreOf(fun.body)
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
exports.reducePatternMatchingToCaseOf = reducePatternMatchingToCaseOf;
/**
 * reduces pattern matching variants of let in, lambda, let rec in expression
 * to core expressions using case of
 */
const coreOf = (e) => {
    switch (e.type) {
        case 'lambda': {
            const x = e.arg;
            if (Pattern_1.isVar(x)) {
                return {
                    type: 'lambda',
                    arg: Pattern_1.varOfPatVar(x),
                    body: exports.coreOf(e.body)
                };
            }
            else {
                // \pat -> e
                // -->
                // \x -> case x of pat -> e
                const x = Expr_1.varOf('x');
                return {
                    type: 'lambda',
                    arg: x,
                    body: {
                        type: 'case_of',
                        arity: 1,
                        value: x,
                        cases: [{
                                pattern: e.arg,
                                expr: exports.coreOf(e.body)
                            }]
                    }
                };
            }
        }
        case 'let_in': {
            const x = e.left;
            if (Pattern_1.isVar(x)) {
                return {
                    type: 'let_in',
                    left: Pattern_1.varOfPatVar(x),
                    middle: exports.coreOf(e.middle),
                    right: exports.coreOf(e.right)
                };
            }
            else {
                // let pat = val in e
                // -->
                // case val of pat -> e
                return {
                    type: 'case_of',
                    value: exports.coreOf(e.middle),
                    arity: 1,
                    cases: [{
                            pattern: e.left,
                            expr: exports.coreOf(e.right)
                        }]
                };
            }
        }
        case 'let_rec_in': {
            const x = e.arg;
            if (Pattern_1.isVar(x)) {
                return {
                    type: 'let_rec_in',
                    arg: Pattern_1.varOfPatVar(x),
                    funName: e.funName,
                    middle: exports.coreOf(e.middle),
                    right: exports.coreOf(e.right)
                };
            }
            else {
                // let rec f pat = val in e
                // -->
                // let rec f x = case x of pat -> val in e
                const x = Expr_1.varOf('x');
                return {
                    type: 'let_rec_in',
                    arg: x,
                    funName: e.funName,
                    right: exports.coreOf(e.right),
                    middle: {
                        type: 'case_of',
                        value: x,
                        arity: 1,
                        cases: [{
                                pattern: e.arg,
                                expr: exports.coreOf(e.middle)
                            }]
                    }
                };
            }
        }
        case 'case_of': {
            return {
                type: 'case_of',
                value: exports.coreOf(e.value),
                arity: e.arity,
                cases: e.cases.map(c => ({
                    pattern: c.pattern,
                    expr: exports.coreOf(c.expr)
                }))
            };
        }
        case 'tyconst': {
            return {
                type: 'tyconst',
                name: e.name,
                args: e.args.map(exports.coreOf)
            };
        }
        case 'if_then_else': {
            return {
                type: 'if_then_else',
                cond: exports.coreOf(e.cond),
                thenBranch: exports.coreOf(e.thenBranch),
                elseBranch: exports.coreOf(e.elseBranch)
            };
        }
        case 'app': {
            return {
                type: 'app',
                lhs: exports.coreOf(e.lhs),
                rhs: exports.coreOf(e.rhs)
            };
        }
        case 'constant': {
            return e;
        }
    }
    return e;
};
exports.coreOf = coreOf;
const coreTupleOf = (vals) => {
    return {
        type: 'tyconst',
        name: 'tuple',
        args: vals
    };
};
const tupleOf = (vals) => {
    return {
        type: 'tyconst',
        name: 'tuple',
        args: vals
    };
};
const casify = (name, funs) => {
    if (funs.length === 1)
        return funs[0];
    const arity = funs[0].args.length;
    // check that arity is consistent
    Common_1.assert(funs.every(f => f.args.length === arity), `inconsistent arities for '${name}', expected ${arity} arguments`);
    // each definition can name arguments differently
    const renamedArgs = Common_1.gen(arity, n => Expr_1.varOf(`x${n}`));
    const testedVal = arity === 1 ?
        renamedArgs[0] :
        tupleOf(renamedArgs);
    const caseOf = {
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
        args: renamedArgs.map(Pattern_1.patVarOfVar),
        body: caseOf
    };
};
exports.casify = casify;
const groupByHead = (funs) => {
    const grouped = new Map();
    for (const f of funs) {
        if (!grouped.has(f.funName.name)) {
            grouped.set(f.funName.name, []);
        }
        grouped.get(f.funName.name)?.push(f);
    }
    return grouped;
};
exports.groupByHead = groupByHead;
