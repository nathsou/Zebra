"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.monomorphizeProg = void 0;
const Context_1 = require("../Inferencer/Context");
const Inferencer_1 = require("../Inferencer/Inferencer");
const Types_1 = require("../Inferencer/Types");
const Unification_1 = require("../Inferencer/Unification");
const Expr_1 = require("../Parser/Expr");
const Sugar_1 = require("../Parser/Sugar");
const Common_1 = require("../Utils/Common");
const Result_1 = require("../Utils/Result");
const specializations = new Map();
// replace overloaded methods by their type-dependent definitions
// http://okmij.org/ftp/Computation/typeclass.html
const monomorphizeProg = (prog, sig) => {
    specializations.clear();
    const renv = new Map();
    const res = [];
    for (const inst of prog.instances) {
        const res = addInstanceToResolutionEnv(inst, renv);
        if (Result_1.isError(res))
            return res;
    }
    for (const f of prog.coreFuncs.values()) {
        const ty = identifierType(f.funName, sig);
        if (Result_1.isError(ty))
            return ty;
        const m = monomorphizeFunDecl(f, ty.value, sig, renv);
        if (Result_1.isError(m)) {
            return m;
        }
        else {
            res.push(...m.value);
        }
    }
    for (const [sp, expr] of specializations.entries()) {
        res.push({
            type: 'fun',
            funName: Expr_1.varOf(sp),
            args: [],
            body: expr
        });
    }
    return Result_1.ok(res);
};
exports.monomorphizeProg = monomorphizeProg;
const addMapping = (f, ty, expr, renv) => {
    if (!renv.has(f)) {
        renv.set(f, []);
    }
    // extend renv with a new mapping
    renv.get(f)?.push([ty, expr]);
};
const addInstanceToResolutionEnv = (inst, renv) => {
    return Result_1.bind(Inferencer_1.instanceMethodsTypes(inst), tys => {
        for (const [method, ty] of tys.entries()) {
            const [_, decl] = Common_1.defined(inst.defs.get(method));
            const e = decl.args.length > 0 ? Sugar_1.lambdaOf(decl.args, decl.body) : decl.body;
            addMapping(method, ty, e, renv);
        }
        return Result_1.ok('()');
    });
};
const monomorphizeFunDecl = (f, ty, sig, renv) => {
    const overloaded = Types_1.isTyOverloaded(ty);
    if (overloaded && f.funName.name !== 'main') {
        addMapping(f.funName.name, ty, f.args.length > 0 ? Sugar_1.lambdaOf(f.args, f.body) : f.body, renv);
        return Result_1.ok([]);
    }
    else {
        return Result_1.bind(monomorphizeExpr(f.body, sig, renv), body => {
            return Result_1.ok([{
                    ...f,
                    body
                }]);
        });
    }
};
const findReplacement = (f, ty, sig, renv) => {
    const key = `${f}_specialized_${Types_1.expandTy(ty).join('_')}`;
    if (specializations.has(key)) {
        return Result_1.ok(Expr_1.varOf(key));
    }
    for (const [tau, expr] of renv.get(f) ?? []) {
        const sigTy = Unification_1.substituteMono(ty, sig);
        if (Result_1.isError(sigTy))
            return sigTy;
        const sigTau = Unification_1.substituteMono(tau, sig);
        if (Result_1.isError(sigTau))
            return sigTau;
        const sig2 = Unification_1.directedUnify(sigTau.value, sigTy.value);
        // console.log(`${f} : ${showMonoTy(sigTau.value)} : ${showMonoTy(sigTy.value)}`);
        if (Result_1.isOk(sig2)) {
            specializations.set(key, expr);
            return Result_1.bind(Unification_1.substCompose(sig2.value, sig), sig21 => {
                return Result_1.bind(monomorphizeExpr(expr, sig21, renv), rep => {
                    specializations.set(key, rep);
                    return Result_1.ok(Expr_1.varOf(key));
                });
            });
        }
    }
    return Result_1.error(`no replacement found for '${f}' with type '${Types_1.showMonoTy((ty))}'`);
};
const identifierType = (v, sig) => {
    if (!Context_1.context.identifiers.has(v.id)) {
        return Result_1.error(`identifier ${v.name} (${v.id}) does not have type information`);
    }
    const [_, ty_] = Common_1.defined(Context_1.context.identifiers.get(v.id));
    const ty = Unification_1.substituteMono(ty_.ty, sig);
    if (Result_1.isError(ty))
        return ty;
    return Result_1.ok(ty.value);
};
const monomorphizeExpr = (e, sig, renv) => {
    switch (e.type) {
        case 'variable': {
            if (Context_1.context.datatypes.has(e.name)) {
                return Result_1.ok(e);
            }
            if (renv.has(e.name)) {
                return Result_1.bind(identifierType(e, sig), ty => {
                    return Result_1.bind(findReplacement(e.name, ty, sig, renv), rep => {
                        return Result_1.ok(rep);
                    });
                });
            }
            else {
                return Result_1.ok(e);
            }
        }
        case 'let_in':
            return Result_1.bind2(monomorphizeExpr(e.middle, sig, renv), monomorphizeExpr(e.right, sig, renv), ([middle, right]) => {
                return Result_1.ok({
                    type: 'let_in',
                    left: e.left,
                    middle,
                    right
                });
            });
        case 'let_rec_in':
            return Result_1.bind2(monomorphizeExpr(e.middle, sig, renv), monomorphizeExpr(e.right, sig, renv), ([middle, right]) => {
                return Result_1.ok({
                    type: 'let_rec_in',
                    funName: e.funName,
                    arg: e.arg,
                    middle,
                    right
                });
            });
        case 'constant':
            return Result_1.ok(e);
        case 'if_then_else': {
            return Result_1.bind3(monomorphizeExpr(e.cond, sig, renv), monomorphizeExpr(e.thenBranch, sig, renv), monomorphizeExpr(e.elseBranch, sig, renv), ([cond, thenBranch, elseBranch]) => {
                return Result_1.ok({
                    type: 'if_then_else',
                    cond,
                    thenBranch,
                    elseBranch
                });
            });
        }
        case 'app': {
            return Result_1.bind2(monomorphizeExpr(e.lhs, sig, renv), monomorphizeExpr(e.rhs, sig, renv), ([lhs, rhs]) => {
                return Result_1.ok({
                    type: 'app',
                    lhs,
                    rhs
                });
            });
        }
        case 'lambda':
            return Result_1.bind(monomorphizeExpr(e.body, sig, renv), body => {
                return Result_1.ok({
                    type: 'lambda',
                    arg: e.arg,
                    body
                });
            });
        case 'case_of':
            return Result_1.bind(monomorphizeExpr(e.value, sig, renv), value => {
                const cases = Result_1.reduceResult(e.cases.map(({ expr, pattern }) => {
                    return Result_1.bind(monomorphizeExpr(expr, sig, renv), e => {
                        return Result_1.ok({ expr: e, pattern });
                    });
                }));
                return Result_1.bind(cases, cases => {
                    return Result_1.ok({
                        type: 'case_of',
                        arity: e.arity,
                        value,
                        cases
                    });
                });
            });
        case 'tyconst': {
            const args = Result_1.reduceResult(e.args.map(a => monomorphizeExpr(a, sig, renv)));
            return Result_1.bind(args, args => {
                return Result_1.ok({
                    type: 'tyconst',
                    name: e.name,
                    args
                });
            });
        }
    }
};
