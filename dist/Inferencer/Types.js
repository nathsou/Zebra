"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.expandTy = exports.canonicalizeTyVars = exports.showTypeEnv = exports.showOverloadedTy = exports.showPolyTy = exports.showTyConst = exports.showTyVar = exports.showMonoTy = exports.polyTypesEq = exports.isTyOverloaded = exports.monoTypesEq = exports.generalizeTy = exports.freshInstance = exports.freshTyVar = exports.isTyConst = exports.isTyVar = exports.polyTy = exports.typeVarNamer = exports.tyConst = exports.tyVar = void 0;
const Common_1 = require("../Utils/Common");
const Context_1 = require("./Context");
const Unification_1 = require("./Unification");
// constructors
const tyVar = (n, context = []) => ({ value: n, context });
exports.tyVar = tyVar;
const tyConst = (name, ...args) => ({ name, args });
exports.tyConst = tyConst;
const typeVarNamer = () => {
    const memo = new Map();
    return {
        name: (name) => {
            if (!memo.has(name)) {
                memo.set(name, exports.tyVar(Context_1.nextTyVarId()));
            }
            return Common_1.defined(memo.get(name));
        },
        reset: () => {
            memo.clear();
        }
    };
};
exports.typeVarNamer = typeVarNamer;
function polyTy(ty, ...polyVars) {
    return {
        ty,
        polyVars: polyVars.map(v => typeof v === 'number' ? v : v.value)
    };
}
exports.polyTy = polyTy;
function isTyVar(x) {
    return x['context'] !== undefined;
}
exports.isTyVar = isTyVar;
function isTyConst(x) {
    return x['args'] !== undefined;
}
exports.isTyConst = isTyConst;
const freshTyVar = () => {
    return exports.tyVar(Context_1.nextTyVarId());
};
exports.freshTyVar = freshTyVar;
/**
 * creates a fresh instance of a polymorphic type
* i.e associates new type names to every polymorphic variable
 */
const freshInstance = ({ polyVars, ty }) => {
    const freshTypes = polyVars.map(exports.freshTyVar);
    return Unification_1.substituteMono(ty, Unification_1.substOf(polyVars, freshTypes));
};
exports.freshInstance = freshInstance;
/**
 * generalizes a monomorphic type with respect to a typing environment
 * to a polymorphic type where all the variables that do not occur (free)
 * in the range of the environment are universally quantiﬁed in the
 * polymorphic type created
 */
const generalizeTy = (env, ty) => {
    const envFreeVars = Unification_1.freeVarsEnv(env);
    const polyVars = [...Unification_1.freeVarsMonoTy(ty)].filter(x => !envFreeVars.has(x));
    return polyTy(ty, ...polyVars);
};
exports.generalizeTy = generalizeTy;
const monoTypesEq = (s, t) => {
    if (isTyConst(s) && isTyConst(t)) {
        return s.name === t.name &&
            s.args.length === t.args.length &&
            s.args.every((a, i) => exports.monoTypesEq(a, t.args[i]));
    }
    if (isTyVar(s) && isTyVar(t)) {
        return s.value === t.value;
    }
    return false;
};
exports.monoTypesEq = monoTypesEq;
const isTyOverloaded = (ty) => {
    if (isTyVar(ty))
        return ty.context.length > 0;
    return ty.args.some(exports.isTyOverloaded);
};
exports.isTyOverloaded = isTyOverloaded;
const polyTypesEq = (s, t) => {
    return Common_1.sameElems(s.polyVars, t.polyVars) && exports.monoTypesEq(s.ty, t.ty);
};
exports.polyTypesEq = polyTypesEq;
const showMonoTy = (t) => {
    if (isTyVar(t))
        return showTyVar(t);
    return exports.showTyConst(t);
};
exports.showMonoTy = showMonoTy;
function showTyVar(t) {
    const v = typeof t === 'number' ? t : t.value;
    const l = String.fromCharCode(945 + v % 23);
    if (v >= 23) {
        return l + `${Math.floor(v / 23)}`;
    }
    // if (typeof t === 'object' && t.context.length !== 0) {
    //     return `(${t.context.map(k => `${k} ${l}`).join(', ')}) => ${l}`;
    // }
    return l;
}
exports.showTyVar = showTyVar;
const showTyConst = (v) => {
    switch (v.name) {
        case '->': return `${exports.showMonoTy(v.args[0])} -> ${exports.showMonoTy(v.args[1])}`;
        case 'tuple': return `(${v.args.map(exports.showMonoTy).join(', ')})`;
    }
    if (v.args.length === 0)
        return v.name;
    return `${v.name} ${v.args.map(a => exports.showMonoTy(a)).join(' ')}`;
};
exports.showTyConst = showTyConst;
const showPolyTy = (t) => {
    if (t.polyVars.length === 0)
        return exports.showMonoTy(t.ty);
    return `${t.polyVars.map(v => `∀${showTyVar(v)}`)}, ${exports.showMonoTy(t.ty)}`;
};
exports.showPolyTy = showPolyTy;
const collectContext = (ty, ctx = new Map()) => {
    if (isTyVar(ty)) {
        for (const k of ty.context) {
            if (!ctx.has(ty.value)) {
                ctx.set(ty.value, new Set());
            }
            ctx.get(ty.value)?.add(k);
        }
    }
    else {
        for (const arg of ty.args) {
            collectContext(arg, ctx);
        }
    }
    return ctx;
};
const showOverloadedTy = (ty) => {
    const str = exports.showMonoTy(ty);
    const ctx = collectContext(ty);
    if (ctx.size === 0)
        return str;
    const constraints = [];
    for (const [a, classes] of ctx.entries()) {
        const v = showTyVar(a);
        for (const k of classes) {
            constraints.push(`${k} ${v}`);
        }
    }
    return `(${constraints.join(', ')}) => ${str}`;
};
exports.showOverloadedTy = showOverloadedTy;
const showTypeEnv = (env) => {
    return `{ ${Object.entries(env).map(([x, ty]) => `${x} : ${exports.showPolyTy(ty)}`).join(', ')} }`;
};
exports.showTypeEnv = showTypeEnv;
const canonicalizeTyVars = (t, renameMap = new Map()) => {
    if (isTyVar(t)) {
        if (renameMap.has(t.value)) {
            return Common_1.defined(renameMap.get(t.value));
        }
        else {
            const n = exports.tyVar(renameMap.size, t.context);
            renameMap.set(t.value, n);
            return n;
        }
    }
    return exports.tyConst(t.name, ...t.args.map(a => exports.canonicalizeTyVars(a, renameMap)));
};
exports.canonicalizeTyVars = canonicalizeTyVars;
const expandTy = (ty, acc = []) => {
    if (isTyVar(ty))
        return [...acc, '*'];
    if (ty.name !== '->') {
        acc.push(ty.name);
    }
    for (const arg of ty.args) {
        exports.expandTy(arg, acc);
    }
    return acc;
};
exports.expandTy = expandTy;
