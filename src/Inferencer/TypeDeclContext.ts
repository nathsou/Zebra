import { PolyTy, TyVar } from "./Types.ts";

// global type declarations context
export const typeDeclContext = {
    instances: new Map<string, string[]>(),
    datatypes: new Map<string, PolyTy>(),
    typeclasses: new Map<string, {
        methods: Map<string, PolyTy>,
        tyVar: TyVar['value']
    }>()
};

export const clearTypeDeclContext = (): void => {
    typeDeclContext.instances.clear();
    typeDeclContext.datatypes.clear();
    typeDeclContext.typeclasses.clear();
};