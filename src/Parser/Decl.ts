import { CoreFuncDecl, showCoreDecl } from "../Core/CoreDecl";
import { canonicalizeTyVars, MonoTy, PolyTy, showMonoTy, showTyVar, TyClass, TyConst, TyVar } from "../Inferencer/Types";
import { Pattern, showPattern } from "../Interpreter/Pattern";
// Declarations are expressions affecting the global environment
import { Expr, showExpr, VarExpr } from "./Expr";

export type Decl = FuncDecl | ExportDecl | ImportDecl | TypeDecl;

export type TypeDecl = DataTypeDecl | TypeClassDecl | InstanceDecl;

export type FuncDecl = {
  type: 'fun',
  funName: VarExpr,
  args: Pattern[],
  body: Expr
};

export type DataTypeDecl = {
  type: 'datatype',
  typeVars: TyVar[],
  name: string,
  variants: TyConst[]
};

export type TypeClassDecl = {
  type: 'typeclass',
  context: TyClass[],
  name: string,
  tyVar: TyVar['value'],
  methods: Map<string, PolyTy>
};

export type InstanceDecl = {
  type: 'instance',
  context: TyClass[],
  class_: string,
  ty: MonoTy,
  defs: Map<string, [TyVar['value'], CoreFuncDecl]>
};

export type ImportDecl = {
  type: 'import',
  path: string,
  imports: string[]
};

export type ExportDecl = {
  type: 'export',
  exports: string[]
};

export const showContext = (ctx: TyClass[]): string => {
  if (ctx.length === 0) return '';
  return ` (${ctx.map(c => `${c.name} ${c.tyVars.map(showTyVar).join(' ')}`).join(', ')}) => `;
};

export const showDecl = (decl: Decl): string => {
  switch (decl.type) {
    case 'fun':
      return `${decl.funName} ${decl.args.map(showPattern).join(' ')} = ${showExpr(decl.body)}`;
    case 'datatype':
      return `data ${decl.name} ${decl.typeVars.map(showMonoTy).join(' ')} = \n` + decl.variants.map(v => '  | ' + showMonoTy(v)).join('\n');
    case 'typeclass':
      return `class${showContext(decl.context)} ${decl.name} ${showTyVar(decl.tyVar)} where\n` +
        [...decl.methods.entries()].map(([name, { ty }]) => `   ${name} : ${showMonoTy(canonicalizeTyVars(ty))}`).join('\n');
    case 'instance':
      return `instance${showContext(decl.context)} ${decl.class_} ${showMonoTy(canonicalizeTyVars(decl.ty))} where\n`
        + [...decl.defs.values()].map(([_, d]) => `    ${showCoreDecl(d)}`).join('\n');
    case 'import':
      return `import "${decl.path}" (${decl.imports.join(', ')})`;
    case 'export':
      return `export (${decl.exports.join(', ')})`;
  }
};