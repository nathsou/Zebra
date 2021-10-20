"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.showPattern = exports.collectPatternSubst = exports.checkedUnify = exports.unifyPattern = exports.vars = exports.isFun = exports.isVar = exports.varOfPatVar = exports.patVarOfVar = exports.patVarOf = void 0;
const Context_1 = require("../Inferencer/Context");
const FixedTypes_1 = require("../Inferencer/FixedTypes");
const Types_1 = require("../Inferencer/Types");
const Unification_1 = require("../Inferencer/Unification");
const Common_1 = require("../Utils/Common");
const Maybe_1 = require("../Utils/Maybe");
const Result_1 = require("../Utils/Result");
const patVarOf = (name) => ({
    value: name,
    id: Context_1.nextVarId()
});
exports.patVarOf = patVarOf;
const patVarOfVar = (v) => ({
    value: v.name,
    id: v.id
});
exports.patVarOfVar = patVarOfVar;
const varOfPatVar = (v) => ({
    type: 'variable',
    name: v.value,
    id: v.id
});
exports.varOfPatVar = varOfPatVar;
function isVar(x) {
    return typeof x['value'] === 'string';
}
exports.isVar = isVar;
function isFun(f) {
    return !isVar(f);
}
exports.isFun = isFun;
const vars = (p, acc = new Set()) => {
    if (isVar(p)) {
        acc.add(p);
        return acc;
    }
    for (const arg of p.args) {
        exports.vars(arg, acc);
    }
    return acc;
};
exports.vars = vars;
const unifyPattern = (p, v) => unifyPatternMany([[p, v]]);
exports.unifyPattern = unifyPattern;
const unifyPatternMany = (eqs) => {
    const sig = {};
    while (eqs.length > 0) {
        const [p, v] = Common_1.defined(eqs.pop());
        if (isVar(p)) { // Eliminate
            const x = p;
            sig[x.value] = v;
            continue;
        }
        if (p.name === '_')
            continue;
        switch (v.type) {
            case 'int':
                if (p.name !== `${v.value}`) {
                    return Maybe_1.None;
                }
                continue;
            case 'char':
                if (p.name !== `'${v.value}'`) {
                    return Maybe_1.None;
                }
                continue;
            case 'tyconst': // Decompose
                if (p.name === v.name &&
                    p.args.length === v.args.length) {
                    for (let i = 0; i < p.args.length; i++) {
                        eqs.push([p.args[i], v.args[i]]);
                    }
                    continue;
                }
                return Maybe_1.None;
            default:
                return Maybe_1.None;
        }
    }
    return sig;
};
const checkedUnify = (s, t, p) => {
    const sig = Unification_1.unify(s, t);
    if (Result_1.isError(sig)) {
        return Result_1.error(`${sig.value} : cannot unify ${Types_1.showMonoTy(s)} with ${Types_1.showMonoTy(t)} in pattern "${exports.showPattern(p)}"`);
    }
    return sig;
};
exports.checkedUnify = checkedUnify;
const collectPatternSubst = (env, p, tau, vars) => {
    if (isVar(p)) {
        // if this is a datatype variant
        if (Context_1.context.datatypes.has(p.value)) {
            const variantTy = Common_1.defined(Context_1.context.datatypes.get(p.value));
            return Result_1.bind(Types_1.freshInstance(variantTy), freshTy => {
                return exports.checkedUnify(tau, freshTy, p);
            });
        }
        else if (vars[p.value] !== undefined) {
            return Result_1.bind(Types_1.freshInstance(vars[p.value]), freshTy => {
                return exports.checkedUnify(tau, freshTy, p);
            });
        }
        else {
            const ty = Types_1.freshTyVar();
            vars[p.value] = Types_1.polyTy(ty);
            return exports.checkedUnify(tau, ty, p);
        }
    }
    if (p.name === '_') {
        return exports.checkedUnify(tau, Types_1.freshTyVar(), p);
    }
    // integers
    if (/[0-9]+/.test(p.name)) {
        return exports.checkedUnify(tau, FixedTypes_1.intTy, p);
    }
    // floats
    if (/[0-9]*\.[0-9]+/.test(p.name)) {
        return exports.checkedUnify(tau, FixedTypes_1.floatTy, p);
    }
    // characters
    if (p.name[0] === "'") {
        return exports.checkedUnify(tau, FixedTypes_1.charTy, p);
    }
    if (p.name !== 'tuple' && !Context_1.context.datatypes.has(p.name)) {
        return Result_1.error(`unknown variant: ${p.name} in pattern "${exports.showPattern(p)}"`);
    }
    const constructorTy = p.name === 'tuple' ?
        FixedTypes_1.tupleTy(p.args.length) :
        Common_1.defined(Context_1.context.datatypes.get(p.name));
    const freshCtorTy = Types_1.freshInstance(constructorTy);
    if (Result_1.isError(freshCtorTy))
        return freshCtorTy;
    const tys = FixedTypes_1.uncurryFun(freshCtorTy.value);
    const retTy = Common_1.defined(tys.pop());
    const res = Result_1.fold(tys, ([sig_i, gamma_i], tau_i, i) => {
        return Result_1.bind(Unification_1.substituteMono(tau_i, sig_i), sig_i_tau_i => {
            return Result_1.bind(exports.collectPatternSubst(gamma_i, p.args[i], sig_i_tau_i, vars), sig => {
                return Result_1.bind(Unification_1.substituteEnv(gamma_i, sig), gamma_n => {
                    return Result_1.bind(Unification_1.substCompose(sig, sig_i), sig_n => {
                        return Result_1.ok([sig_n, gamma_n]);
                    });
                });
            });
        });
    }, [{}, env]);
    return Result_1.bind(res, ([sig_n]) => {
        return Result_1.bind(Unification_1.substituteMono(retTy, sig_n), s => {
            return Result_1.bind(Unification_1.substituteMono(tau, sig_n), t => {
                return Result_1.bind(exports.checkedUnify(s, t, p), sig2 => {
                    return Unification_1.substCompose(sig2, sig_n);
                });
            });
        });
    });
};
exports.collectPatternSubst = collectPatternSubst;
const showPattern = (p) => {
    if (isVar(p))
        return p.value;
    if (p.args.length === 0)
        return p.name;
    if (p.name === 'tuple') {
        return `(${p.args.map(exports.showPattern).join(', ')})`;
    }
    return `${p.name} ${p.args.map(exports.showPattern).join(' ')}`;
};
exports.showPattern = showPattern;
