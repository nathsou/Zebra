import { context, nextVarId } from "../Inferencer/Context";
import { charTy, floatTy, intTy, tupleTy, uncurryFun } from "../Inferencer/FixedTypes";
import { freshInstance, freshTyVar, MonoTy, polyTy, PolyTy, showMonoTy, TypeEnv } from "../Inferencer/Types";
import { substCompose, substituteEnv, substituteMono, TypeSubst, unify } from "../Inferencer/Unification";
import { VarExpr } from "../Parser/Expr";
import { defined } from "../Utils/Common";
import { Maybe, None } from "../Utils/Maybe";
import { bind, error, fold, isError, ok, Result } from "../Utils/Result";
import { Value } from "./Value";

export type Pattern = Var | Fun;

export type Var = { value: string, id: number };
export type Fun = { name: string, args: Pattern[] };
export type ValSubst = { [x: string]: Value };

export const patVarOf = (name: string) => ({
    value: name,
    id: nextVarId()
});

export const patVarOfVar = (v: VarExpr): Var => ({
    value: v.name,
    id: v.id
});

export const varOfPatVar = (v: Var): VarExpr => ({
    type: 'variable',
    name: v.value,
    id: v.id
});

export function isVar(x: Pattern): x is Var {
    return typeof (x as Record<string, any>)['value'] === 'string';
}

export function isFun(f: Pattern): f is Fun {
    return !isVar(f);
}

export const vars = (p: Pattern, acc: Set<Var> = new Set()): Set<Var> => {
    if (isVar(p)) {
        acc.add(p);
        return acc;
    }

    for (const arg of p.args) {
        vars(arg, acc);
    }

    return acc;
};


export const unifyPattern = (p: Pattern, v: Value): Maybe<ValSubst> => unifyPatternMany([[p, v]]);

const unifyPatternMany = (eqs: Array<[Pattern, Value]>): Maybe<ValSubst> => {
    const sig: ValSubst = {};

    while (eqs.length > 0) {
        const [p, v] = defined(eqs.pop());


        if (isVar(p)) { // Eliminate
            const x = p;
            sig[x.value] = v;
            continue;
        }

        if (p.name === '_') continue;

        switch (v.type) {
            case 'int':
                if (p.name !== `${v.value}`) {
                    return None;
                }
                continue;
            case 'char':
                if (p.name !== `'${v.value}'`) {
                    return None;
                }
                continue;
            case 'tyconst': // Decompose
                if (
                    p.name === v.name &&
                    p.args.length === v.args.length
                ) {
                    for (let i = 0; i < p.args.length; i++) {
                        eqs.push([p.args[i], v.args[i]]);
                    }
                    continue;
                }
                return None;
            default:
                return None;
        }
    }

    return sig;
};

export const checkedUnify = (
    s: MonoTy,
    t: MonoTy,
    p: Pattern
): Result<TypeSubst, string> => {
    const sig = unify(s, t);

    if (isError(sig)) {
        return error(`${sig.value} : cannot unify ${showMonoTy(s)} with ${showMonoTy(t)} in pattern "${showPattern(p)}"`);
    }

    return sig;
};

export const collectPatternSubst = (
    env: TypeEnv,
    p: Pattern,
    tau: MonoTy,
    vars: Record<string, PolyTy>
): Result<TypeSubst, string> => {
    if (isVar(p)) {
        // if this is a datatype variant
        if (context.datatypes.has(p.value)) {
            const variantTy = defined(context.datatypes.get(p.value));
            return bind(freshInstance(variantTy), freshTy => {
                return checkedUnify(tau, freshTy, p);
            });
        } else if (vars[p.value] !== undefined) {
            return bind(freshInstance(vars[p.value]), freshTy => {
                return checkedUnify(tau, freshTy, p);
            });
        } else {
            const ty = freshTyVar();
            vars[p.value] = polyTy(ty);
            return checkedUnify(tau, ty, p);
        }
    }

    if (p.name === '_') {
        return checkedUnify(tau, freshTyVar(), p);
    }

    // integers
    if (/[0-9]+/.test(p.name)) {
        return checkedUnify(tau, intTy, p);
    }

    // floats
    if (/[0-9]*\.[0-9]+/.test(p.name)) {
        return checkedUnify(tau, floatTy, p);
    }

    // characters
    if (p.name[0] === "'") {
        return checkedUnify(tau, charTy, p);
    }

    if (p.name !== 'tuple' && !context.datatypes.has(p.name)) {
        return error(`unknown variant: ${p.name} in pattern "${showPattern(p)}"`);
    }

    const constructorTy = p.name === 'tuple' ?
        tupleTy(p.args.length) :
        defined(context.datatypes.get(p.name));

    const freshCtorTy = freshInstance(constructorTy);
    if (isError(freshCtorTy)) return freshCtorTy;

    const tys = uncurryFun(freshCtorTy.value);
    const retTy = defined(tys.pop());

    const res = fold(tys, ([sig_i, gamma_i], tau_i, i) => {
        return bind(substituteMono(tau_i, sig_i), sig_i_tau_i => {
            return bind(collectPatternSubst(gamma_i, p.args[i], sig_i_tau_i, vars), sig => {
                return bind(substituteEnv(gamma_i, sig), gamma_n => {
                    return bind(substCompose(sig, sig_i), sig_n => {
                        return ok([sig_n, gamma_n] as const);
                    });
                });
            });
        });
    }, [{} as TypeSubst, env] as const);

    return bind(res, ([sig_n]) => {
        return bind(substituteMono(retTy, sig_n), s => {
            return bind(substituteMono(tau, sig_n), t => {
                return bind(checkedUnify(s, t, p), sig2 => {
                    return substCompose(sig2, sig_n);
                });
            });
        });
    });
};

export const showPattern = (p: Pattern): string => {
    if (isVar(p)) return p.value;
    if (p.args.length === 0) return p.name;
    if (p.name === 'tuple') {
        return `(${p.args.map(showPattern).join(', ')})`;
    }
    return `${p.name} ${p.args.map(showPattern).join(' ')}`;
};