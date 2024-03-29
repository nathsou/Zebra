import { nextVarId } from "../Inferencer/Context";
import { Pattern, showPattern } from "../Interpreter/Pattern";

export type Expr =
  AtomicExpr |
  LetInExpr |
  LetRecInExpr |
  LambdaExpr |
  IfThenElseExpr |
  AppExpr |
  CaseOfExpr;

export const varOf = (name: string) => {
  const res = varOfAux(name);
  // console.log(`varOf: ${name} : ${res.id}`);
  return res;
};

export const varOfAux = (name: string): VarExpr => ({
  type: 'variable',
  name,
  id: nextVarId()
});

export type VarExpr = {
  type: 'variable',
  name: string,
  id: number
};

export type TyConstExpr = {
  type: 'tyconst',
  name: string,
  args: Expr[]
};

export type ConstantExpr = IntegerExpr | FloatExpr | CharExpr;

export type IntegerExpr = {
  type: 'constant',
  kind: 'integer',
  value: number
};

export type FloatExpr = {
  type: 'constant',
  kind: 'float',
  value: number
};

export type CharExpr = {
  type: 'constant',
  kind: 'char',
  value: string
};

export type LambdaExpr = {
  type: 'lambda',
  arg: Pattern,
  body: Expr
};

export type LetInExpr = {
  type: 'let_in',
  left: Pattern,
  middle: Expr,
  right: Expr
};

export type LetRecInExpr = {
  type: 'let_rec_in',
  funName: VarExpr,
  arg: Pattern,
  middle: Expr,
  right: Expr
};

export type IfThenElseExpr = {
  type: 'if_then_else',
  cond: Expr,
  thenBranch: Expr,
  elseBranch: Expr
};

export type AppExpr = {
  type: 'app',
  lhs: Expr,
  rhs: Expr
};

export type AtomicExpr = ConstantExpr | VarExpr | TyConstExpr;

export type CaseOfExprCase = {
  pattern: Pattern,
  expr: Expr
};

export type CaseOfExpr = {
  type: 'case_of',
  value: Expr,
  arity: number,
  cases: CaseOfExprCase[]
};

export const showExpr = (expr: Expr): string => {
  switch (expr.type) {
    case 'variable':
      return expr.name;
    case 'constant':
      switch (expr.kind) {
        case 'integer':
          return `${expr.value}`;
        case 'float':
          return `${expr.value}`;
        case 'char':
          return `'${expr.value}'`;
      }
    case 'let_in':
      return `let ${showPattern(expr.left)} = ${showExpr(expr.middle)} in ${showExpr(expr.right)}`;
    case 'let_rec_in':
      return `let rec ${expr.funName} ${showPattern(expr.arg)} = ${showExpr(expr.middle)} in ${showExpr(expr.right)}`;
    case 'lambda':
      return `λ${showPattern(expr.arg)} -> ${showExpr(expr.body)}`;
    case 'if_then_else':
      return `if ${showExpr(expr.cond)} then ${showExpr(expr.thenBranch)} else ${showExpr(expr.elseBranch)}`;
    case 'app':
      return `((${showExpr(expr.lhs)}) ${showExpr(expr.rhs)})`;
    case 'tyconst':
      if (expr.args.length === 0) {
        return expr.name;
      }

      if (expr.name === 'tuple') {
        return `(${expr.args.map(showExpr).join(', ')})`;
      }

      return `(${expr.name} ${expr.args.map(a => showExpr(a)).join(' ')})`;
    case 'case_of':
      const cases = expr.cases.map(({ pattern, expr }) => `${showPattern(pattern)} -> ${showExpr(expr)}`);
      return `case ${showExpr(expr.value)} of ${cases.join('  | ')}`;
  }
};