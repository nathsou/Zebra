import { VarExpr } from "../Parser/Expr";
import { MonoTy, PolyTy, TyVar } from "./Types";

export const nextVarId = (): number => context.varId++;
export const nextTyVarId = (): number => context.tyVarId++;

export type ClassName = string;
export type DataTypeName = string;
export type VariantName = string;
export type MethodName = string;

// global context
export const context = {
  varId: 0,
  tyVarId: 0,
  instances: new Map<ClassName, DataTypeName[]>(),
  datatypes: new Map<VariantName, PolyTy>(),
  typeclasses: new Map<ClassName, {
    methods: Map<MethodName, PolyTy>,
    tyVar: TyVar['value']
  }>(),
  typeClassMethods: new Map<MethodName, PolyTy>(),
  typeClassMethodsOccs: new Map<VarExpr['id'], [MonoTy, MethodName]>(),
  identifiers: new Map<number, [string, PolyTy]>()
};

export const clearContext = (): void => {
  context.varId = 0;
  context.tyVarId = 0;
  context.instances.clear();
  context.datatypes.clear();
  context.typeclasses.clear();
  context.typeClassMethods.clear();
  context.typeClassMethodsOccs.clear();
  context.identifiers.clear();
};