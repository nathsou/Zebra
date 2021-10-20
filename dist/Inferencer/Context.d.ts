import { MonoTy, PolyTy, TyVar } from "./Types";
export declare const nextVarId: () => number;
export declare const nextTyVarId: () => number;
export declare type ClassName = string;
export declare type DataTypeName = string;
export declare type VariantName = string;
export declare type MethodName = string;
export declare const context: {
    varId: number;
    tyVarId: number;
    instances: Map<string, string[]>;
    datatypes: Map<string, PolyTy>;
    typeclasses: Map<string, {
        methods: Map<MethodName, PolyTy>;
        tyVar: TyVar['value'];
    }>;
    typeClassMethods: Map<string, PolyTy>;
    typeClassMethodsOccs: Map<number, [MonoTy, string]>;
    identifiers: Map<number, [string, PolyTy]>;
};
export declare const clearContext: () => void;
