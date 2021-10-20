import { cache, mapOf } from "../Utils/Common";
import { emptyEnv, envAddMut } from "../Utils/Env";
import { boolTy, charTy, floatTy, funTy, intTy, stringTy } from "./FixedTypes";
import { polyTy, TypeEnv } from "./Types";

export type PrimitiveFunction = keyof (typeof primitivesObj);

const primitivesObj = {
    'plusInt': polyTy(funTy(intTy, intTy, intTy)),
    'minusInt': polyTy(funTy(intTy, intTy, intTy)),
    'timesInt': polyTy(funTy(intTy, intTy, intTy)),
    'divideInt': polyTy(funTy(intTy, intTy, intTy)),
    'modInt': polyTy(funTy(intTy, intTy, intTy)),
    'eqInt': polyTy(funTy(intTy, intTy, boolTy)),
    'lssInt': polyTy(funTy(intTy, intTy, boolTy)),
    'leqInt': polyTy(funTy(intTy, intTy, boolTy)),
    'gtrInt': polyTy(funTy(intTy, intTy, boolTy)),
    'geqInt': polyTy(funTy(intTy, intTy, boolTy)),
    'stringOfInt': polyTy(funTy(intTy, stringTy)),
    'plusFloat': polyTy(funTy(floatTy, floatTy, floatTy)),
    'minusFloat': polyTy(funTy(floatTy, floatTy, floatTy)),
    'timesFloat': polyTy(funTy(floatTy, floatTy, floatTy)),
    'divideFloat': polyTy(funTy(floatTy, floatTy, floatTy)),
    'eqFloat': polyTy(funTy(floatTy, floatTy, boolTy)),
    'lssFloat': polyTy(funTy(floatTy, floatTy, boolTy)),
    'leqFloat': polyTy(funTy(floatTy, floatTy, boolTy)),
    'gtrFloat': polyTy(funTy(floatTy, floatTy, boolTy)),
    'geqFloat': polyTy(funTy(floatTy, floatTy, boolTy)),
    'floatOfInt': polyTy(funTy(intTy, floatTy)),
    'stringOfFloat': polyTy(funTy(floatTy, stringTy)),
    'eqChar': polyTy(funTy(charTy, charTy, boolTy))
};

export const primitives = mapOf(primitivesObj);

export function isPrimitiveFunc(f: string): f is PrimitiveFunction {
    return primitives.has(f);
}

export const primitiveEnv = cache((): TypeEnv => {
    const env: TypeEnv = emptyEnv();

    for (const [f, ty] of primitives.entries()) {
        envAddMut(env, f, ty);
    }

    return env;
});