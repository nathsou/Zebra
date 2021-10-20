"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.crocoPrimitives = void 0;
const Common_1 = require("../../Utils/Common");
const plusInt = 'ZePlusInt a b = a + b';
const minusInt = 'ZeMinusInt a b = a - b';
const timesInt = 'ZeTimesInt a b = a * b';
const divideInt = 'ZeDivideInt a b = a / b';
const modInt = 'ZeModInt a b = a % b';
const eqInt = 'ZeEqInt a b = a == b';
const lssInt = 'ZeLssInt a b = a < b';
const leqInt = 'ZeLeqInt a b = a <= b';
const gtrInt = 'ZeGtrInt a b = a > b';
const geqInt = 'ZeGeqInt a b = a >= b';
const stringOfInt = 'ZeStringOfInt _ = NotSupported(StringOfInt)';
const plusFloat = 'ZePlusFloat _ _ = NotSupported(PlusFloat)';
const minusFloat = 'ZeMinusFloat _ _ = NotSupported(MinusFloat)';
const timesFloat = 'ZeTimesFloat _ _ = NotSupported(TimesFloat)';
const divideFloat = 'ZeDivideFloat _ _ = NotSupported(DivideFloat)';
const eqFloat = 'ZeEqFloat _ _ = NotSupported(EqFloat)';
const lssFloat = 'ZeLssFloat _ _ = NotSupported(LssFloat)';
const leqFloat = 'ZeLeqFloat _ _ = NotSupported(Leqloat)';
const gtrFloat = 'ZeGtrFloat _ _ = NotSupported(GtrFloat)';
const geqFloat = 'ZeGeqFloat _ _ = NotSupported(GeqFloat)';
const stringOfFloat = 'ZeStringOfIntFloat _ = NotSupported(StringOfFloat)';
const floatOfInt = 'ZeFloatOfInt _ = NotSupported(FloatOfInt)';
const eqChar = 'ZeEqChar a b = a == b';
const crocoPrimitivesObj = {
    'plusInt': plusInt,
    'minusInt': minusInt,
    'timesInt': timesInt,
    'divideInt': divideInt,
    'modInt': modInt,
    'eqInt': eqInt,
    'lssInt': lssInt,
    'leqInt': leqInt,
    'gtrInt': gtrInt,
    'geqInt': geqInt,
    'stringOfInt': stringOfInt,
    'plusFloat': plusFloat,
    'minusFloat': minusFloat,
    'timesFloat': timesFloat,
    'divideFloat': divideFloat,
    'eqFloat': eqFloat,
    'lssFloat': lssFloat,
    'leqFloat': leqFloat,
    'gtrFloat': gtrFloat,
    'geqFloat': geqFloat,
    'stringOfFloat': stringOfFloat,
    'floatOfInt': floatOfInt,
    'eqChar': eqChar
};
exports.crocoPrimitives = Common_1.cache(() => Common_1.mapOf(crocoPrimitivesObj));
