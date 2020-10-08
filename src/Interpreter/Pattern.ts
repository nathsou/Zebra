import { funReturnTy, intTy } from "../Inferencer/FixedTypes.ts";
import { freshInstance, freshTyVar, MonoTy, polyTy, PolyTy, TyConst, tyConst, TypeEnv } from "../Inferencer/Types.ts";
import { TypeSubst } from "../Inferencer/Unification.ts";
import { Expr, TyConstExpr } from "../Parser/Expr.ts";
import { envGet } from "../Utils/Env.ts";
import { Maybe, None } from "../Utils/Mabye.ts";
import { Value } from "./Value.ts";

export type Pattern = Var | Fun;

export type Var = string;
export type Fun = { name: string, args: Pattern[] };
export type ValSubst = { [x: string]: Value };

export function isVar(x: Pattern): x is Var {
    return typeof x === 'string';
}

export function isFun(f: Pattern): f is Fun {
    return typeof f === 'object';
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

// unify [(Cons h tl, Cons 3 Nil)]
// unify [(h tl, 3 Nil)]
// unify [(tl, Nil)] . { h -> 3 }
// unify [] . { h -> 3, tl -> Nil }

export const unifyPattern = (p: Pattern, v: Value): Maybe<ValSubst> => unifyPatternMany([[p, v]]);

const unifyPatternMany = (eqs: Array<[Pattern, Value]>): Maybe<ValSubst> => {
    const sig: ValSubst = {};

    while (eqs.length > 0) {
        const [p, v] = eqs.pop() as [Pattern, Value];

        if (isVar(p)) { // Eliminate
            const x = p;
            sig[x] = v;
            continue;
        }

        switch (v.type) {
            case 'int':
                if (p.name !== `${v.value}`) {
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

export const typeOfPattern = (
    p: Pattern,
    sig: Record<string, PolyTy>,
    env: TypeEnv
): PolyTy => {
    if (isVar(p)) {
        const tau = polyTy(freshTyVar());
        sig[p] = tau;
        return tau;
    }

    if (/[0-9]+/.test(p.name)) return polyTy(intTy);

    const retTy = envGet(env, p.name);
    const ty = funReturnTy(retTy.ty) as TyConst;

    const polyVars = retTy.polyVars.slice(p.args.length);

    return polyTy(tyConst(ty.name, ...p.args.map(a => typeOfPattern(a, sig, env).ty), ...polyVars), ...polyVars);
};

export const showPattern = (p: Pattern): string => {
    if (isVar(p)) return p;
    if (p.args.length === 0) return p.name;
    return `${p.name} ${p.args.map(showPattern).join(' ')}`;
};