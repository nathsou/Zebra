"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.primitiveEnv = exports.isPrimitiveFunc = exports.primitives = void 0;
const Common_1 = require("../Utils/Common");
const Env_1 = require("../Utils/Env");
const FixedTypes_1 = require("./FixedTypes");
const Types_1 = require("./Types");
const primitivesObj = {
    'plusInt': Types_1.polyTy(FixedTypes_1.funTy(FixedTypes_1.intTy, FixedTypes_1.intTy, FixedTypes_1.intTy)),
    'minusInt': Types_1.polyTy(FixedTypes_1.funTy(FixedTypes_1.intTy, FixedTypes_1.intTy, FixedTypes_1.intTy)),
    'timesInt': Types_1.polyTy(FixedTypes_1.funTy(FixedTypes_1.intTy, FixedTypes_1.intTy, FixedTypes_1.intTy)),
    'divideInt': Types_1.polyTy(FixedTypes_1.funTy(FixedTypes_1.intTy, FixedTypes_1.intTy, FixedTypes_1.intTy)),
    'modInt': Types_1.polyTy(FixedTypes_1.funTy(FixedTypes_1.intTy, FixedTypes_1.intTy, FixedTypes_1.intTy)),
    'eqInt': Types_1.polyTy(FixedTypes_1.funTy(FixedTypes_1.intTy, FixedTypes_1.intTy, FixedTypes_1.boolTy)),
    'lssInt': Types_1.polyTy(FixedTypes_1.funTy(FixedTypes_1.intTy, FixedTypes_1.intTy, FixedTypes_1.boolTy)),
    'leqInt': Types_1.polyTy(FixedTypes_1.funTy(FixedTypes_1.intTy, FixedTypes_1.intTy, FixedTypes_1.boolTy)),
    'gtrInt': Types_1.polyTy(FixedTypes_1.funTy(FixedTypes_1.intTy, FixedTypes_1.intTy, FixedTypes_1.boolTy)),
    'geqInt': Types_1.polyTy(FixedTypes_1.funTy(FixedTypes_1.intTy, FixedTypes_1.intTy, FixedTypes_1.boolTy)),
    'stringOfInt': Types_1.polyTy(FixedTypes_1.funTy(FixedTypes_1.intTy, FixedTypes_1.stringTy)),
    'plusFloat': Types_1.polyTy(FixedTypes_1.funTy(FixedTypes_1.floatTy, FixedTypes_1.floatTy, FixedTypes_1.floatTy)),
    'minusFloat': Types_1.polyTy(FixedTypes_1.funTy(FixedTypes_1.floatTy, FixedTypes_1.floatTy, FixedTypes_1.floatTy)),
    'timesFloat': Types_1.polyTy(FixedTypes_1.funTy(FixedTypes_1.floatTy, FixedTypes_1.floatTy, FixedTypes_1.floatTy)),
    'divideFloat': Types_1.polyTy(FixedTypes_1.funTy(FixedTypes_1.floatTy, FixedTypes_1.floatTy, FixedTypes_1.floatTy)),
    'eqFloat': Types_1.polyTy(FixedTypes_1.funTy(FixedTypes_1.floatTy, FixedTypes_1.floatTy, FixedTypes_1.boolTy)),
    'lssFloat': Types_1.polyTy(FixedTypes_1.funTy(FixedTypes_1.floatTy, FixedTypes_1.floatTy, FixedTypes_1.boolTy)),
    'leqFloat': Types_1.polyTy(FixedTypes_1.funTy(FixedTypes_1.floatTy, FixedTypes_1.floatTy, FixedTypes_1.boolTy)),
    'gtrFloat': Types_1.polyTy(FixedTypes_1.funTy(FixedTypes_1.floatTy, FixedTypes_1.floatTy, FixedTypes_1.boolTy)),
    'geqFloat': Types_1.polyTy(FixedTypes_1.funTy(FixedTypes_1.floatTy, FixedTypes_1.floatTy, FixedTypes_1.boolTy)),
    'floatOfInt': Types_1.polyTy(FixedTypes_1.funTy(FixedTypes_1.intTy, FixedTypes_1.floatTy)),
    'stringOfFloat': Types_1.polyTy(FixedTypes_1.funTy(FixedTypes_1.floatTy, FixedTypes_1.stringTy)),
    'eqChar': Types_1.polyTy(FixedTypes_1.funTy(FixedTypes_1.charTy, FixedTypes_1.charTy, FixedTypes_1.boolTy))
};
exports.primitives = Common_1.mapOf(primitivesObj);
function isPrimitiveFunc(f) {
    return exports.primitives.has(f);
}
exports.isPrimitiveFunc = isPrimitiveFunc;
exports.primitiveEnv = Common_1.cache(() => {
    const env = Env_1.emptyEnv();
    for (const [f, ty] of exports.primitives.entries()) {
        Env_1.envAddMut(env, f, ty);
    }
    return env;
});
