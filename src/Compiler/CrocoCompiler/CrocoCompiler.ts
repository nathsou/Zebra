import { coreOf } from "../../Core/Casify.ts";
import { coreExprFreeVars, varEnvOf } from "../../Core/ExprOfFunDecls.ts";
import { isVar, Pattern, vars } from "../../Interpreter/Pattern.ts";
import { Decl } from "../../Parser/Decl.ts";
import { Expr } from "../../Parser/Expr.ts";
import { renameVars } from '../../Parser/RenameVars.ts';

const camel = (f: string): string => {
    return `${f[0].toUpperCase()}${f.slice(1)}`;
};

const rename = (f: string): string => {
    if (f === 'main') return 'Main';
    return `Ze${camel(f)}`;
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

    if (pattern.name === 'Nil') return '[]';
    if (pattern.name === 'Cons') {
        const [h, tl] = pattern.args;
        return `(${crocoPatternOf(h)}:${crocoPatternOf(tl)})`;
    }

    if (pattern.name === 'tuple') return `(${pattern.args.map(crocoPatternOf).join(', ')})`;
    if (pattern.name[0] === "'") return pattern.name.charCodeAt(1).toString();
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
            if (expr.name === 'tuple') return `(${expr.args.map(a => crocoExprOf(a, topLevelFuncs, funcNames)).join(', ')})`;
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
            const middle = crocoExprOf(renameVars(expr.middle, { [expr.funName]: name }), topLevelFuncs, funcNames);
            const right = crocoExprOf(renameVars(expr.right, { [expr.funName]: name }), topLevelFuncs, funcNames);
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
                case 'char':
                    return `${expr.value.charCodeAt(0)}`;
            }
        case 'case_of': {
            const name = `CaseOf${topLevelFuncs.length}`;

            const freeVars = new Set<string>();

            // collect free variables
            for (const c of expr.cases) {
                const fv = coreExprFreeVars(
                    coreOf(c.expr),
                    varEnvOf(...vars(c.pattern), ...funcNames));

                for (const v of fv) {
                    if (v[0] === v[0].toLowerCase()) {
                        freeVars.add(v);
                    }
                }
            }

            const freeVarsArgs = [...freeVars].join(' ');

            for (const c of expr.cases) {
                const pat = crocoPatternOf(c.pattern);
                const e = crocoExprOf(c.expr, topLevelFuncs, funcNames);
                topLevelFuncs.push(`${name} ${pat} ${freeVarsArgs} = ${e}`);
            }

            const val = crocoExprOf(expr.value, topLevelFuncs, funcNames);

            return `(${name} ${val} ${freeVarsArgs})`;
        }
        case 'lambda': {
            const arg = crocoPatternOf(expr.arg);
            const body = crocoExprOf(expr.body, topLevelFuncs, funcNames);
            return `(\\${arg} -> ${body})`;
        }
        case 'binop': {
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
