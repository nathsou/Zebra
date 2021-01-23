import { PolyTy } from "./Types.ts";

// global type declarations context
export const typeDeclContext = {
    // type classes instances
    instances: new Map<string, string[]>(),
    datatypes: new Map<string, PolyTy>(),
    typeclasses: new Map<string, Map<string, PolyTy>>()
};

export const clearTypeDeclContext = (): void => {
    typeDeclContext.instances.clear();
    typeDeclContext.datatypes.clear();
};