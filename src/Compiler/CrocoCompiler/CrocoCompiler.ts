import { isVar, Pattern } from "../../Interpreter/Pattern.ts";
import { Decl } from "../../Parser/Decl.ts";
import { Expr } from "../../Parser/Expr.ts";

const camel = (f: string): string => {
    return `${f[0].toUpperCase()}${f.slice(1)}`;
};

const rename = (f: string): string => {
    if (f === 'main') return 'Main';
    return `Ze${f[0].toUpperCase()}${f.slice(1)}`;
};

export const crocoProgramOf = (prog: Decl[]): string => {
    const topLevelFuncs: string[] = [];
    const funcNames = new Set<string>();

    // collect function names
    for (const decl of prog) {
        if (decl.type === 'fun') {
            funcNames.add(decl.name);
        }
    }

    const decls = prog
        .map(decl => crocoDeclOf(decl, topLevelFuncs, funcNames))
        .filter(s => s.length > 0)
        .join('\n');
    
    return topLevelFuncs.join('\n') + '\n' + decls;
};

export const crocoDeclOf = (decl: Decl, topLevelFuncs: string[], funcNames: Set<string>): string => {
    switch (decl.type) {
        case 'datatype':
            return '';

        case 'fun':
            const name = rename(decl.name);
            const args = decl.args.map(crocoPatternOf).join(' ');
            const body = crocoExprOf(decl.body, topLevelFuncs, funcNames);
            return `${name} ${args} = ${body}`;
    }
};

export const crocoPatternOf = (pattern: Pattern): string => {
    if (isVar(pattern)) return pattern;
    if (pattern.args.length === 0) return camel(pattern.name);
    return `(${camel(pattern.name)} ${pattern.args.map(crocoPatternOf).join(' ')})`;
};

export const crocoExprOf = (expr: Expr, topLevelFuncs: string[], funcNames: Set<string>): string => {
    switch (expr.type) {
        case 'variable':
            if (funcNames.has(expr.name)) return rename(expr.name);
            return expr.name;
        case 'tyconst':
            if (expr.args.length === 0) return camel(expr.name);
            return `(${camel(expr.name)} ${expr.args.map(a => crocoExprOf(a, topLevelFuncs, funcNames)).join(' ')})`;
        case 'let_in': {
            const left = crocoPatternOf(expr.left);
            const middle = crocoExprOf(expr.middle, topLevelFuncs, funcNames);
            const right = crocoExprOf(expr.right, topLevelFuncs, funcNames);
            return `let ${left} = ${middle} in ${right}`;
        }
        case 'let_rec_in': {
            const name = `LetRec${topLevelFuncs.length}`;
            const left = crocoPatternOf(expr.arg);
            const middle = crocoExprOf(renameVar(expr.middle, expr.funName, name), topLevelFuncs, funcNames);
            const right = crocoExprOf(renameVar(expr.right, expr.funName, name), topLevelFuncs, funcNames);
            topLevelFuncs.push(`${name} ${left} = ${middle}`);

            return right;
        }
        case 'if_then_else':
            const cond = crocoExprOf(expr.cond, topLevelFuncs, funcNames);
            const thenBranch = crocoExprOf(expr.thenBranch, topLevelFuncs, funcNames);
            const elseBranch = crocoExprOf(expr.elseBranch, topLevelFuncs, funcNames);
            
            return `(if ${cond} then ${thenBranch} else ${elseBranch})`;
        case 'constant':
            switch (expr.kind) {
                case 'integer':
                    return `${expr.value}`;
            }
        case 'case_of': {
            const name = `CaseOf${topLevelFuncs.length}`;
            
            for (const c of expr.cases) {
                const pat = crocoPatternOf(c.pattern);
                const e = crocoExprOf(c.expr, topLevelFuncs, funcNames);
                topLevelFuncs.push(`${name} ${pat} = ${e}`);
            }

            const val = crocoExprOf(expr.value, topLevelFuncs, funcNames);
            
            return `(${name} ${val})`;
        }
        case 'lambda': {
            const arg = crocoPatternOf(expr.arg);
            const body = crocoExprOf(expr.body, topLevelFuncs, funcNames);
            return `(\\${arg} -> ${body})`;
        }
        case 'binop':{
            const lhs = crocoExprOf(expr.left, topLevelFuncs, funcNames);
            const rhs = crocoExprOf(expr.right, topLevelFuncs, funcNames);
            return `(${lhs} ${expr.operator} ${rhs})`;
        } 
        case 'app': {
            const lhs = crocoExprOf(expr.lhs, topLevelFuncs, funcNames);
            const rhs = crocoExprOf(expr.rhs, topLevelFuncs, funcNames);
            return `(${lhs} ${rhs})`;
        }
    }
};

const renameVar = (e: Expr, x: string, by: string): Expr => {
    switch (e.type) {
        case 'variable':
            if (e.name === x) return { type: 'variable', name: by };
            return e;
        case 'constant':
            return e;
        case 'binop': {
            return {
                type: 'binop',
                operator: e.operator,
                left: renameVar(e.left, x, by),
                right: renameVar(e.right, x, by)
            };
        }
        case 'tyconst': {
            return {
                type: 'tyconst',
                name: e.name,
                args: e.args.map(a => renameVar(a, x, by))
            };
        }
        case 'if_then_else': {
            return {
                type: 'if_then_else',
                cond: renameVar(e.cond, x, by),
                thenBranch: renameVar(e.thenBranch, x, by),
                elseBranch: renameVar(e.elseBranch, x, by)
            };
        }
        case 'app': {
            return {
                type: 'app',
                lhs: renameVar(e.lhs, x, by),
                rhs: renameVar(e.rhs, x, by)
            };
        }
        case 'lambda': {
            return {
                type: 'lambda',
                arg: e.arg,
                body: renameVar(e.body, x, by)
            };
        }
        case 'let_in': {
            return {
                type: 'let_in',
                left: e.left,
                middle: renameVar(e.middle, x, by),
                right: renameVar(e.right, x, by),
            };
        }
        case 'let_rec_in': {
            return {
                type: 'let_rec_in',
                funName: e.funName,
                arg: e.arg,
                middle: renameVar(e.middle, x, by),
                right: renameVar(e.right, x, by)
            }
        }
        case 'case_of': {
            return {
                type: 'case_of',
                arity: e.arity,
                cases: e.cases.map(c => ({
                    pattern: c.pattern,
                    expr: renameVar(c.expr, x, by)
                })),
                value: renameVar(e.value, x, by)
            };
        }
    }
};