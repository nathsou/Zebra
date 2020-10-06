import { TyConstVal as ValTyConst } from "../Interpreter/Value.ts";
import { ConstantExpr } from "../Parser/Expr.ts";
import { Maybe, None } from "../Utils/Mabye.ts";
import { MonoTy, PolyTy, polyTy, tyConst, tyVar } from "./Types.ts";

export const intTy = tyConst('Int');
export const boolTy = tyConst('Bool');

export const funTy = (a: MonoTy, b: MonoTy, ...ts: MonoTy[]): MonoTy => {
    return funTyAux(a, b, ...ts);
};

const funTyAux = (a: MonoTy, ...ts: MonoTy[]): MonoTy => {
    if (ts.length === 1) return tyConst('->', a, ts[0]);
    return tyConst('->', a, funTyAux(ts[0], ...ts.slice(1)));
};

export const tyConstTy = (t: ValTyConst) => tyConst(t.name);

const intOpTy = funTy(intTy, funTy(intTy, intTy));
const intBoolOpTy = funTy(intTy, funTy(intTy, boolTy));

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