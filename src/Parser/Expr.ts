
export type Expr = AtomicExpr | BinopExpr | LetInExpr | LetRecInExpr | LambdaExpr | IfThenElseExpr | AppExpr;

export type IdentifierExpr = {
    type: 'identifier',
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
    arg: string,
    body: Expr
};

export type LetInExpr = {
    type: 'let_in',
    left: string,
    middle: Expr,
    right: Expr
};

export type LetRecInExpr = {
    type: 'let_rec_in',
    funName: string,
    arg: string,
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

export type AtomicExpr = ConstantExpr | IdentifierExpr | TyConstExpr;

export type BinopExpr = {
    type: 'binop',
    operator: string,
    left: Expr,
    right: Expr
};

export const showExpr = (expr: Expr): string => {
    switch (expr.type) {
        case 'identifier':
            return expr.name;
        case 'constant':
            switch (expr.kind) {
                case 'integer':
                    return `${expr.value}`;
            }
        case 'binop':
            return `(${showExpr(expr.left)} ${expr.operator} ${showExpr(expr.right)})`;
        case 'let_in':
            return `let ${expr.left} = ${showExpr(expr.middle)} in ${showExpr(expr.right)}`;
        case 'let_rec_in':
            return `let rec ${expr.funName} ${expr.arg} = ${showExpr(expr.middle)} in ${showExpr(expr.right)}`;
        case 'lambda':
            return `λ${expr.arg} -> ${showExpr(expr.body)}`;
        case 'if_then_else':
            return `if ${showExpr(expr.cond)} then ${showExpr(expr.thenBranch)} else ${showExpr(expr.elseBranch)}`;
        case 'app':
            return `((${showExpr(expr.lhs)}) ${showExpr(expr.rhs)})`;
        case 'tyconst':
            if (expr.args.length === 0) {
                return expr.name;
            }

            return `${expr.name} ${expr.args.map(showExpr).join(' ')}`;
    }
};