"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.interpret = exports.registerDecl = void 0;
const CoreExpr_1 = require("../Core/CoreExpr");
const TypeCheck_1 = require("../Inferencer/TypeCheck");
const Expr_1 = require("../Parser/Expr");
const Sugar_1 = require("../Parser/Sugar");
const Env_1 = require("../Utils/Env");
const Maybe_1 = require("../Utils/Maybe");
const Result_1 = require("../Utils/Result");
const Pattern_1 = require("./Pattern");
const PrimitiveVals_1 = require("./PrimitiveVals");
const Value_1 = require("./Value");
const checkType = (res, type) => {
    return Result_1.bind(res, val => {
        if (val.type !== type) {
            return Result_1.error(`expected value of type "${type}", got "${val.type}"`);
        }
        return Result_1.ok(val);
    });
};
const evalExpr = (expr, env) => {
    switch (expr.type) {
        case 'variable':
            const id = expr.name;
            if (Env_1.envHas(env, id)) {
                const val = Env_1.envGet(env, id);
                if (val.type === 'recvar') {
                    const cl = {
                        type: 'closure',
                        arg: val.arg,
                        body: val.body,
                        env: Env_1.envAdd(val.env, val.name, val)
                    };
                    return Result_1.ok(cl);
                }
                return Result_1.ok(val);
            }
            else {
                return Result_1.error(`unbound identifier: "${id}"`);
            }
        case 'tyconst':
            return Result_1.bind(Result_1.mapResult(expr.args.map(e => evalExpr(e, env)), x => x), args => {
                return Result_1.ok({ type: 'tyconst', name: expr.name, args });
            });
        case 'if_then_else':
            const { cond, thenBranch, elseBranch } = expr;
            return Result_1.bind(checkType(evalExpr(cond, env), 'tyconst'), cond => {
                if (cond.name === 'True') {
                    return evalExpr(thenBranch, env);
                }
                else {
                    return evalExpr(elseBranch, env);
                }
            });
        case 'constant':
            switch (expr.kind) {
                case 'integer':
                    return Result_1.ok({ type: 'int', value: expr.value });
                case 'float':
                    return Result_1.ok({ type: 'float', value: expr.value });
                case 'char':
                    return Result_1.ok({ type: 'char', value: expr.value });
            }
        case 'let_in':
            return Result_1.bind(evalExpr(expr.middle, env), val => {
                const env2 = Env_1.envAdd(env, expr.left.name, val);
                return evalExpr(expr.right, env2);
            });
        case 'let_rec_in':
            const recvar = {
                type: 'recvar',
                name: expr.funName.name,
                arg: expr.arg.name,
                body: expr.middle,
                env
            };
            const env2 = Env_1.envAdd(env, expr.funName.name, recvar);
            return evalExpr(expr.right, env2);
        case 'lambda':
            return Result_1.ok({ type: 'closure', arg: expr.arg.name, body: expr.body, env });
        case 'app':
            return Result_1.bind(evalExpr(expr.lhs, env), f => {
                switch (f.type) {
                    case 'closure':
                        return Result_1.bind(evalExpr(expr.rhs, env), val => {
                            return evalExpr(f.body, Env_1.envAdd(f.env, f.arg, val));
                        });
                    case 'primitive_func':
                        return Result_1.bind(evalExpr(expr.rhs, env), val => {
                            return Result_1.ok(f.body(val));
                        });
                    default:
                        return Result_1.error(`expected value of type 'closure' or 'primitive_func', got: ${f.type}`);
                }
            });
        case 'case_of':
            return Result_1.bind(evalExpr(expr.value, env), val => {
                for (const { pattern, expr: e } of expr.cases) {
                    const sig = Pattern_1.unifyPattern(pattern, val);
                    if (Maybe_1.isSome(sig)) {
                        const env2 = Env_1.envSum(env, sig);
                        return evalExpr(e, env2);
                    }
                }
                return Result_1.error(`pattern matching is not exhaustive in "${CoreExpr_1.showCoreExpr(expr)}", failed with: "${Value_1.showValue(val)}"`);
            });
    }
};
const registerDecl = (decls) => {
    const env = PrimitiveVals_1.primitiveValEnv();
    const constants = [];
    for (const decl of decls) {
        switch (decl.type) {
            case 'fun': {
                if (decl.args.length === 0) {
                    // constant declaration
                    constants.push(decl);
                }
                else {
                    const curried = Sugar_1.lambdaOf(decl.args.length > 0 ?
                        decl.args :
                        [Expr_1.varOf('_')], decl.body);
                    const recvar = {
                        type: 'recvar',
                        name: decl.funName.name,
                        arg: curried.arg.name,
                        body: curried.body,
                        env
                    };
                    Env_1.envAddMut(env, decl.funName.name, recvar);
                }
                break;
            }
            case 'datatype': {
                // introduce a variant constructor for each datatype variant
                for (const variant of decl.variants) {
                    // constant / nullary variants
                    if (variant.args.length === 0) {
                        Env_1.envAddMut(env, variant.name, {
                            type: 'tyconst',
                            name: variant.name,
                            args: []
                        });
                    }
                    else { // compound variants
                        const args = variant.args.map((_, i) => `x${i}`);
                        const body = {
                            type: 'tyconst',
                            name: variant.name,
                            args: args.map(x => Expr_1.varOf(x))
                        };
                        Env_1.envAddMut(env, variant.name, {
                            type: 'closure',
                            arg: args[0],
                            body: args.length > 1 ? Sugar_1.lambdaOf(args.slice(1).map(Expr_1.varOf), body) : body,
                            env
                        });
                    }
                }
                break;
            }
        }
    }
    // evaluate constant declarations
    // "unbound variable" errors can occur
    // if constants[n] references constants[m] where n < m
    for (const { funName, body } of constants) {
        const res = evalExpr(body, env);
        if (Result_1.isOk(res)) {
            Env_1.envAddMut(env, funName.name, res.value);
        }
        else {
            return res;
        }
    }
    return Result_1.ok(env);
};
exports.registerDecl = registerDecl;
const interpret = (prog) => {
    return Result_1.bind(TypeCheck_1.typeCheck(prog), ({ ty, main, coreProg }) => {
        return Result_1.bind(exports.registerDecl(coreProg), env => {
            return Result_1.bind(evalExpr(main.body, env), res => {
                return Result_1.ok([res, ty]);
            });
        });
    });
};
exports.interpret = interpret;
