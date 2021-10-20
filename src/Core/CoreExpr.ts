import { freshTyVar, TyVar } from "../Inferencer/Types";
import { Pattern, patVarOfVar, showPattern } from "../Interpreter/Pattern";
import { Expr, VarExpr } from "../Parser/Expr";

// export type T> = T & { ty: TyVar };

// export const typed = <T>(obj: T): T> => {
//     (obj as Record<string, any>)['ty'] = freshTyVar();
//     return obj as T>;
// };

export type CoreExpr = CoreAtomicExpr | CoreAppExpr | CoreIfThenElseExpr
  | CoreCaseOfExpr | CoreLambdaExpr | CoreLetInExpr | CoreLetRecInExpr;

export type CoreLambdaExpr = {
  type: 'lambda',
  arg: CoreVarExpr,
  body: CoreExpr
};

export type CoreLetInExpr = {
  type: 'let_in',
  left: CoreVarExpr,
  middle: CoreExpr,
  right: CoreExpr
};

export type CoreLetRecInExpr = {
  type: 'let_rec_in',
  funName: CoreVarExpr,
  arg: CoreVarExpr,
  middle: CoreExpr,
  right: CoreExpr
};

export type CoreCaseOfExprCase = {
  pattern: Pattern,
  expr: CoreExpr
};

export type CoreCaseOfExpr = {
  type: 'case_of',
  value: CoreExpr,
  arity: number,
  cases: CoreCaseOfExprCase[]
};

export type CoreVarExpr = VarExpr;

export type CoreTyConstExpr = {
  type: 'tyconst',
  name: string,
  args: CoreExpr[]
};

export type CoreConstantExpr = CoreIntegerExpr | CoreFloatExpr | CoreCharExpr;

export type CoreIntegerExpr = {
  type: 'constant',
  kind: 'integer',
  value: number
};

export type CoreFloatExpr = {
  type: 'constant',
  kind: 'float',
  value: number
};

export type CoreCharExpr = {
  type: 'constant',
  kind: 'char',
  value: string
};

export type CoreIfThenElseExpr = {
  type: 'if_then_else',
  cond: CoreExpr,
  thenBranch: CoreExpr,
  elseBranch: CoreExpr
};

export type CoreAppExpr = {
  type: 'app',
  lhs: CoreExpr,
  rhs: CoreExpr
};

export type CoreAtomicExpr = CoreConstantExpr | CoreVarExpr | CoreTyConstExpr;

export const showCoreExpr = (e: CoreExpr, showVarIds = false): string => {
  switch (e.type) {
    case 'variable':
      return showVarIds ? `${e.name}@${e.id}` : e.name;
    case 'constant':
      switch (e.kind) {
        case 'integer':
          return `${e.value}`;
        case 'float':
          return `${e.value}`;
        case 'char':
          return `'${e.value}'`;
      }
    case 'let_in': {
      const name = showVarIds ? `${e.left.name}@${e.left.id}` : e.left.name;
      return `let ${name} = ${showCoreExpr(e.middle, showVarIds)} in ${showCoreExpr(e.right, showVarIds)}`;
    }
    case 'let_rec_in': {
      const name = showVarIds ? `${e.funName.name}@${e.funName.id}` : e.funName.name;
      return `let rec ${name} ${e.arg.name} = ${showCoreExpr(e.middle, showVarIds)} in ${showCoreExpr(e.right, showVarIds)}`;
    }
    case 'lambda': {
      const name = showVarIds ? `${e.arg.name}@${e.arg.id}` : e.arg.name;
      return `λ${name} -> ${showCoreExpr(e.body, showVarIds)}`;
    }
    case 'if_then_else':
      return `if ${showCoreExpr(e.cond, showVarIds)} then ${showCoreExpr(e.thenBranch, showVarIds)} else ${showCoreExpr(e.elseBranch, showVarIds)}`;
    case 'app':
      return `((${showCoreExpr(e.lhs, showVarIds)}) ${showCoreExpr(e.rhs, showVarIds)})`;
    case 'tyconst':
      if (e.args.length === 0) {
        return e.name;
      }

      if (e.name === 'tuple') {
        return `(${e.args.map(a => showCoreExpr(a, showVarIds)).join(', ')})`;
      }

      return `(${e.name} ${e.args.map(a => showCoreExpr(a, showVarIds)).join(' ')})`;
    case 'case_of':
      const cases = e.cases.map(({ pattern, expr }) => `${showPattern(pattern)} -> ${showCoreExpr(expr, showVarIds)}`);
      return `case ${showCoreExpr(e.value, showVarIds)} of ${cases.join('  | ')}`;
  }
};

export const exprOfCore = (e: CoreExpr): Expr => {
  switch (e.type) {
    case 'constant':
      return e;
    case 'app':
      return {
        type: 'app',
        lhs: exprOfCore(e.lhs),
        rhs: exprOfCore(e.rhs)
      };
    case 'case_of':
      return {
        type: 'case_of',
        arity: e.arity,
        value: exprOfCore(e.value),
        cases: e.cases.map(({ expr, pattern }) => ({
          expr: exprOfCore(expr),
          pattern
        }))
      };
    case 'if_then_else':
      return {
        type: 'if_then_else',
        cond: exprOfCore(e.cond),
        thenBranch: exprOfCore(e.thenBranch),
        elseBranch: exprOfCore(e.elseBranch)
      };
    case 'lambda':
      return {
        type: 'lambda',
        arg: patVarOfVar(e.arg),
        body: exprOfCore(e.body)
      };
    case 'let_in':
      return {
        type: 'let_in',
        left: patVarOfVar(e.left),
        middle: exprOfCore(e.middle),
        right: exprOfCore(e.right)
      };

    case 'let_rec_in':
      return {
        type: 'let_rec_in',
        arg: patVarOfVar(e.arg),
        funName: e.funName,
        middle: exprOfCore(e.middle),
        right: exprOfCore(e.right)
      };
    case 'tyconst':
      return {
        type: 'tyconst',
        name: e.name,
        args: e.args.map(exprOfCore)
      };
    case 'variable':
      return e;
  }
};