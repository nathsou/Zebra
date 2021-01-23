import { assert } from "https://deno.land/std@0.83.0/testing/asserts.ts";
import { TyConstVal as ValTyConst } from "../Interpreter/Value.ts";
import { ConstantExpr } from "../Parser/Expr.ts";
import { gen } from "../Utils/Common.ts";
import { Maybe, None } from "../Utils/Maybe.ts";
import { freshTyVar, isTyConst, MonoTy, PolyTy, polyTy, tyConst, tyVar } from "./Types.ts";

// primitive types
export const intTy = tyConst('Int');
export const floatTy = tyConst('Float');
export const boolTy = tyConst('Bool');
export const charTy = tyConst('Char');
export const unitTy = tyConst('()');

// at least one argument
export function funTy(...ts: MonoTy[]): MonoTy {
    assert(ts.length > 0);
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

export const uncurryFun = (f: MonoTy): MonoTy[] => {
    if (isTyConst(f) && f.name === '->') {
        return [f.args[0], ...uncurryFun(f.args[1])];
    }

    return [f];
};

export const tyConstTy = (t: ValTyConst) => tyConst(t.name);

const intOpTy = funTy(intTy, intTy, intTy);
const intBoolOpTy = funTy(intTy, intTy, boolTy);

export const tupleTy = (n: number): PolyTy => {
    const tys = gen(n, () => freshTyVar());
    return polyTy(funTy(...tys, tyConst('tuple', ...tys)), ...tys);
};

export const constantTy = (c: ConstantExpr): PolyTy => {
    switch (c.kind) {
        case 'integer':
            return polyTy(intTy);
        case 'float':
            return polyTy(floatTy);
        case 'char':
            return polyTy(charTy);
    }
};

const binopTyMap: Record<string, PolyTy> = {
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
    if (binopTyMap[op] !== undefined) {
        return binopTyMap[op];
    }

    return None;
};