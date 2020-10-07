import { TyConstVal as ValTyConst } from "../Interpreter/Value.ts";
import { ConstantExpr } from "../Parser/Expr.ts";
import { Maybe, None } from "../Utils/Mabye.ts";
import { isTyConst, MonoTy, PolyTy, polyTy, tyConst, tyVar } from "./Types.ts";

export const intTy = tyConst('Int');
export const boolTy = tyConst('Bool');
export const unitTy = tyConst('()');

// at least one argument
export function funTy(a: MonoTy, ...ts: MonoTy[]): MonoTy;
export function funTy(...ts: MonoTy[]): MonoTy {
    const h = ts.length === 1 ? unitTy : ts[0];
    const tl = ts.length === 1 ? [ts[0]] : ts.slice(1);
    return funTyAux(h, ...tl);
}

const funTyAux = (a: MonoTy, ...ts: MonoTy[]): MonoTy => {
    if (ts.length === 1) return tyConst('->', a, ts[0]);
    return tyConst('->', a, funTyAux(ts[0], ...ts.slice(1)));
};

/**
 * retrieves the return type of a function type
 * i.e. the rightmost type in a -> b -> ... -> ret
 */
export const funReturnTy = (f: MonoTy): MonoTy => {
    if (isTyConst(f) && f.name === '->') {
        return funReturnTy(f.args[1]);
    }

    return f;
};

export const tyConstTy = (t: ValTyConst) => tyConst(t.name);

const intOpTy = funTy(intTy, intTy, intTy);
const intBoolOpTy = funTy(intTy, intTy, boolTy);

export const constantTy = (c: ConstantExpr): PolyTy => {
    switch (c.kind) {
        case 'integer':
            return polyTy(intTy);
    }
};

const binopTyMap = {
    '+': polyTy(intOpTy),
    '-': polyTy(intOpTy),
    '*': polyTy(intOpTy),
    '/': polyTy(intOpTy),
    '%': polyTy(intOpTy),
    '>': polyTy(intBoolOpTy),
    '>=': polyTy(intBoolOpTy),
    '<': polyTy(intBoolOpTy),
    '<=': polyTy(intBoolOpTy),
    // ∀α, α -> α -> Bool
    '==': polyTy(funTy(tyVar(0), funTy(tyVar(0), boolTy)), tyVar(0))
};

export const binopTy = (op: string): Maybe<PolyTy> => {
    if ((binopTyMap as Record<string, PolyTy>)[op] !== undefined) {
        return (binopTyMap as Record<string, PolyTy>)[op];
    }

    return None;
};