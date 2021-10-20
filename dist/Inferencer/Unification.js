"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.showSubst = exports.substOf = exports.substCompose = exports.substituteEnv = exports.substitutePoly = exports.freeVarsEnv = exports.freeVarsPolyTy = exports.freeVarsMonoTy = exports.substituteMono = exports.directedUnify = exports.unify = void 0;
const Common_1 = require("../Utils/Common");
const Env_1 = require("../Utils/Env");
const Result_1 = require("../Utils/Result");
const Context_1 = require("./Context");
const Types_1 = require("./Types");
const unify = (s, t) => {
    return unifyMany([[s, t]]);
};
exports.unify = unify;
const directedUnify = (s, t) => {
    return unifyMany([[s, t]], true);
};
exports.directedUnify = directedUnify;
// https://www.researchgate.net/publication/2683816_Implementing_Type_Classes
const propagateClasses = (classes, ty) => {
    if (Types_1.isTyVar(ty)) {
        for (const k of classes) {
            if (!ty.context.includes(k)) {
                ty.context.push(k);
            }
        }
    }
    else {
        for (const k of classes) {
            const res = propagateClassTyConst(k, ty);
            if (Result_1.isError(res))
                return res;
        }
    }
    return Result_1.ok('()');
};
const propagateClassTyConst = (class_, ty) => {
    const res = findInstanceContext(ty.name, class_);
    if (Result_1.isError(res))
        return res;
    for (const arg of ty.args) {
        propagateClasses([class_], arg);
    }
    return Result_1.ok('()');
};
const findInstanceContext = (ctor, class_) => {
    const { instances } = Context_1.context;
    if (!instances.get(class_)?.includes(ctor) &&
        !instances.get(class_)?.includes('*')) {
        return Result_1.error(`no instance of class ${class_} found for ${ctor}`);
    }
    return Result_1.ok('()');
};
function substituteMono(m, sig, excluded = []) {
    if (Types_1.isTyVar(m)) {
        if (sig[m.value] !== undefined && !excluded.includes(m.value)) {
            const l = sig[m.value];
            if (Types_1.isTyVar(l) &&
                l.value === m.value &&
                Common_1.sameElems(l.context, m.context)) {
                return Result_1.ok({ ...m });
            }
            return Result_1.bind(substituteMono(l, sig, excluded), ty => {
                const res = propagateClasses(m.context, ty);
                if (Result_1.isError(res))
                    return res;
                return Result_1.ok(ty);
            });
        }
        else {
            return Result_1.ok({ ...m });
        }
    }
    return Result_1.bind(Result_1.reduceResult(m.args.map(t => substituteMono(t, sig, excluded))), args => Result_1.ok(Types_1.tyConst(m.name, ...args)));
}
exports.substituteMono = substituteMono;
const freeVarsMonoTy = (ty, acc = new Set()) => {
    if (Types_1.isTyVar(ty)) {
        acc.add(ty.value);
        return acc;
    }
    for (const t of ty.args) {
        exports.freeVarsMonoTy(t, acc);
    }
    return acc;
};
exports.freeVarsMonoTy = freeVarsMonoTy;
const freeVarsPolyTy = ({ polyVars, ty }, acc = new Set()) => {
    const vs = exports.freeVarsMonoTy(ty, acc);
    for (const v of vs) {
        if (polyVars.includes(v)) {
            vs.delete(v);
        }
    }
    return vs;
};
exports.freeVarsPolyTy = freeVarsPolyTy;
const freeVarsEnv = (env) => {
    const vs = new Set();
    for (const ty of Object.values(env)) {
        exports.freeVarsPolyTy(ty, vs);
    }
    return vs;
};
exports.freeVarsEnv = freeVarsEnv;
const renameTyVars = (ty, rename) => {
    if (Types_1.isTyVar(ty))
        return rename(ty);
    return Types_1.tyConst(ty.name, ...ty.args.map(t => renameTyVars(t, rename)));
};
function substitutePoly(t, sig) {
    return Result_1.bind(substituteMono(t.ty, sig, t.polyVars), ty => {
        return Result_1.ok(Types_1.polyTy(ty, ...t.polyVars));
    });
}
exports.substitutePoly = substitutePoly;
const substituteEnv = (env, sig) => {
    return Env_1.envMapRes(env, t => substitutePoly(t, sig));
};
exports.substituteEnv = substituteEnv;
const substCompose = (sig1, ...sigs) => {
    let sig = { ...sig1 };
    for (const sig2 of sigs) {
        const res = substComposeBin(sig, sig2);
        if (Result_1.isError(res))
            return res;
        sig = res.value;
    }
    return Result_1.ok(sig);
};
exports.substCompose = substCompose;
const substComposeBin = (sig1, sig2) => {
    const sig = {};
    for (const [x, t] of Object.entries(sig1)) {
        const res = substituteMono(t, sig2);
        if (Result_1.isError(res))
            return res;
        sig[x] = res.value;
    }
    for (const [y, t] of Object.entries(sig2)) {
        sig[y] = t;
    }
    return Result_1.ok(sig);
};
const occurs = (x, t) => {
    if (Types_1.isTyVar(t))
        return x.value === t.value;
    return t.args.some(arg => occurs(x, arg));
};
const unifyMany = (eqs, directed = false) => {
    const sig = {};
    while (eqs.length > 0) {
        const [s, t] = Common_1.defined(eqs.pop());
        if (Types_1.monoTypesEq(s, t)) { // Delete
            continue;
        }
        if (Types_1.isTyVar(s)) { // Eliminate
            if (occurs(s, t)) {
                return Result_1.error('occur_check');
            }
            else {
                const res = propagateClasses(s.context, t);
                if (Result_1.isError(res))
                    return res;
                sig[s.value] = t;
                for (let i = 0; i < eqs.length; i++) {
                    const resA = substituteMono(eqs[i][0], sig);
                    if (Result_1.isError(resA))
                        return resA;
                    const resB = substituteMono(eqs[i][1], sig);
                    if (Result_1.isError(resB))
                        return resB;
                    eqs[i][0] = resA.value;
                    eqs[i][1] = resB.value;
                }
                continue;
            }
        }
        if (!directed && Types_1.isTyVar(t)) { // Orient
            eqs.push([t, s]);
            continue;
        }
        if ( // Decompose
        Types_1.isTyConst(s) && Types_1.isTyConst(t) &&
            s.name === t.name &&
            s.args.length == t.args.length) {
            for (let i = 0; i < s.args.length; i++) {
                eqs.push([s.args[i], t.args[i]]);
            }
            continue;
        }
        return Result_1.error('no_rule_applies');
    }
    return Result_1.ok(sig);
};
const substOf = (vars, tys) => {
    const sig = {};
    for (let i = 0; i < Math.min(vars.length, tys.length); i++) {
        sig[vars[i]] = tys[i];
    }
    return sig;
};
exports.substOf = substOf;
const showSubst = (subst) => {
    return `{ ${Object.entries(subst).map(([x, ty]) => `${Types_1.showTyVar(Types_1.tyVar(parseInt(x)))} : ${Types_1.showMonoTy(ty)}`).join(', ')} }`;
};
exports.showSubst = showSubst;
