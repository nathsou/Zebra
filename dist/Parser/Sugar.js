"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.appOf = exports.cons = exports.listOf = exports.lambdaOf = void 0;
const Common_1 = require("../Utils/Common");
const Expr_1 = require("./Expr");
/**
 * creates a curried lambda expression from a list of arguments and the body
 */
const lambdaOf = (args, body) => lambdaAux([...args].reverse(), body);
exports.lambdaOf = lambdaOf;
const lambdaAux = (args, body) => {
    Common_1.assert(args.length > 0, 'lambdaOf called with a function with no arguments');
    if (args.length === 1)
        return { type: 'lambda', arg: args[0], body };
    const [h, tl] = [args[0], args.slice(1)];
    const subBody = { type: 'lambda', arg: h, body: body };
    return lambdaAux(tl, subBody);
};
const listOf = (vals) => {
    return exports.cons(vals);
};
exports.listOf = listOf;
const Cons = Expr_1.varOf('Cons');
const Nil = Expr_1.varOf('Nil');
const cons = (vals) => {
    if (vals.length === 0)
        return Nil;
    return {
        type: 'app',
        lhs: {
            type: 'app',
            lhs: Cons,
            rhs: vals[0]
        },
        rhs: exports.cons(vals.slice(1))
    };
};
exports.cons = cons;
const appOf = (...exprs) => {
    Common_1.assert(exprs.length > 1);
    const e = Common_1.defined(exprs.pop());
    return {
        type: 'app',
        lhs: exprs.length > 1 ? exports.appOf(...exprs) : exprs[0],
        rhs: e
    };
};
exports.appOf = appOf;
