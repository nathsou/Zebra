import { Pattern, showPattern } from "../Interpreter/Pattern.ts";

export type Expr = AtomicExpr | BinopExpr | LetInExpr | LetRecInExpr |
    LambdaExpr | IfThenElseExpr | AppExpr | CaseOfExpr;

export type VarExpr = {
    type: 'variable',
    name: string
};

export type TyConstExpr = {
    type: 'tyconst',
    name: string,
    args: Expr[]
};

export type ConstantExpr = IntegerExpr;

export type IntegerExpr = {
    type: 'constant',
    kind: 'integer',
    value: number
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
    funName: string,
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

export type BinopExpr = {
    type: 'binop',
    operator: string,
    left: Expr,
    right: Expr
};

export type CaseOfExprCase = {
    pattern: Pattern,
    expr: Expr
};

export type CaseOfExpr = {
    type: 'case_of',
    value: Expr,
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
            }
        case 'binop':
            return `(${showExpr(expr.left)} ${expr.operator} ${showExpr(expr.right)})`;
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

            return `${expr.name} ${expr.args.map(a => showExpr(a)).join(' ')}`;
        case 'case_of':
            const cases = expr.cases.map(({ pattern, expr }) => `${showPattern(pattern)} -> ${showExpr(expr)}`);
            return `case ${showExpr(expr.value)} of ${cases.join('  | ')}`;
    }
};

/**
 * creates a curried lambda expression from a list of arguments and the body
 */
export const lambdaOf = (args: Pattern[], body: Expr): LambdaExpr => lambdaAux([...args].reverse(), body);

const lambdaAux = (args: Pattern[], body: Expr): LambdaExpr => {
    if (args.length === 0) return { type: 'lambda', arg: '_', body };
    if (args.length === 1) return { type: 'lambda', arg: args[0], body };
    const [h, tl] = [args[0], args.slice(1)];
    return lambdaAux(tl, { type: 'lambda', arg: h, body });
};