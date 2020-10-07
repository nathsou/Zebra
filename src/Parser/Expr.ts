
export type Expr = AtomicExpr | BinopExpr | LetInExpr | LetRecInExpr |
    LambdaExpr | IfThenElseExpr | AppExpr;

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

export type AtomicExpr = ConstantExpr | VarExpr | TyConstExpr;

export type BinopExpr = {
    type: 'binop',
    operator: string,
    left: Expr,
    right: Expr
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

/**
 * creates a curried lambda expression from a list of arguments and the body
 */
export const lambdaOf = (args: string[], body: Expr): LambdaExpr => lambdaAux([...args].reverse(), body);

const lambdaAux = (args: string[], body: Expr): LambdaExpr => {
    if (args.length === 0) return { type: 'lambda', arg: '_', body };
    if (args.length === 1) return { type: 'lambda', arg: args[0], body };
    const [h, tl] = [args[0], args.slice(1)];
    return lambdaAux(tl, { type: 'lambda', arg: h, body });
};