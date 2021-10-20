"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.binopTy = exports.constantTy = exports.tupleTy = exports.tyConstTy = exports.uncurryFun = exports.funReturnTy = exports.funTy = exports.stringTy = exports.unitTy = exports.charTy = exports.boolTy = exports.floatTy = exports.intTy = void 0;
const Common_1 = require("../Utils/Common");
const Maybe_1 = require("../Utils/Maybe");
const Types_1 = require("./Types");
// primitive types
exports.intTy = Types_1.tyConst('Int');
exports.floatTy = Types_1.tyConst('Float');
exports.boolTy = Types_1.tyConst('Bool');
exports.charTy = Types_1.tyConst('Char');
exports.unitTy = Types_1.tyConst('()');
exports.stringTy = Types_1.tyConst('List', exports.charTy);
// at least one argument
function funTy(...ts) {
    Common_1.assert(ts.length > 0);
    const h = ts.length === 1 ? exports.unitTy : ts[0];
    const tl = ts.length === 1 ? [ts[0]] : ts.slice(1);
    return funTyAux(h, ...tl);
}
exports.funTy = funTy;
const funTyAux = (a, ...ts) => {
    if (ts.length === 1)
        return Types_1.tyConst('->', a, ts[0]);
    return Types_1.tyConst('->', a, funTyAux(ts[0], ...ts.slice(1)));
};
/**
 * retrieves the return type of a function type
 * i.e. the rightmost type in a -> b -> ... -> ret
 */
const funReturnTy = (f) => {
    if (Types_1.isTyConst(f) && f.name === '->') {
        return exports.funReturnTy(f.args[1]);
    }
    return f;
};
exports.funReturnTy = funReturnTy;
const uncurryFun = (f) => {
    if (Types_1.isTyConst(f) && f.name === '->') {
        return [f.args[0], ...exports.uncurryFun(f.args[1])];
    }
    return [f];
};
exports.uncurryFun = uncurryFun;
const tyConstTy = (t) => Types_1.tyConst(t.name);
exports.tyConstTy = tyConstTy;
const intOpTy = funTy(exports.intTy, exports.intTy, exports.intTy);
const intBoolOpTy = funTy(exports.intTy, exports.intTy, exports.boolTy);
const tupleTy = (n) => {
    const tys = Common_1.gen(n, () => Types_1.freshTyVar());
    return Types_1.polyTy(funTy(...tys, Types_1.tyConst('tuple', ...tys)), ...tys);
};
exports.tupleTy = tupleTy;
const constantTy = (c) => {
    switch (c.kind) {
        case 'integer':
            return Types_1.polyTy(exports.intTy);
        case 'float':
            return Types_1.polyTy(exports.floatTy);
        case 'char':
            return Types_1.polyTy(exports.charTy);
    }
};
exports.constantTy = constantTy;
const binopTyMap = {
    '+': Types_1.polyTy(intOpTy),
    '-': Types_1.polyTy(intOpTy),
    '*': Types_1.polyTy(intOpTy),
    '/': Types_1.polyTy(intOpTy),
    '%': Types_1.polyTy(intOpTy),
    '>': Types_1.polyTy(intBoolOpTy),
    '>=': Types_1.polyTy(intBoolOpTy),
    '<': Types_1.polyTy(intBoolOpTy),
    '<=': Types_1.polyTy(intBoolOpTy),
    // ∀α, α -> α -> Bool
    '==': Types_1.polyTy(funTy(Types_1.tyVar(0), funTy(Types_1.tyVar(0), exports.boolTy)), Types_1.tyVar(0))
};
const binopTy = (op) => {
    if (binopTyMap[op] !== undefined) {
        return binopTyMap[op];
    }
    return Maybe_1.None;
};
exports.binopTy = binopTy;
