import { vars } from "../Interpreter/Pattern.ts";
import { DataTypeDecl } from "../Parser/Decl.ts";
import { lambdaOf } from "../Parser/Sugar.ts";
import { decons, partition } from "../Utils/Common.ts";
import { CoreDecl, CoreFuncDecl } from "./CoreDecl.ts";
import { CoreExpr, CoreLetInExpr, CoreLetRecInExpr } from "./CoreExpr.ts";

type VarEnv = { [key: string]: true };
type Dependencies = Map<string, Set<string>>;

const addEnvMut = (env: VarEnv, ...xs: string[]): VarEnv => {
    for (const x of xs) {
        env[x] = true;
    }

    return env;
};

const addEnv = (env: VarEnv, ...xs: string[]) => addEnvMut({ ...env }, ...xs);
const varEnvOf = (...xs: string[]) => addEnvMut({}, ...xs);

// returns a single expression representing the whole program
// which contains no global function declarations
export const exprOfFunDelcs = (prog: CoreDecl[]) => {
    const deps = funcDeclsDependencies(prog);

    const cy = cycles(deps, 'main');

    if (cy.size > 0) {
        throw new Error(`${[...cy].join(', ')} are mutually recursive, not supported yet`);
    }

    const funs = new Map<string, CoreFuncDecl>();

    for (const decl of prog) {
        if (decl.type === 'fun') {
            funs.set(decl.name, decl);
        }
    }

    const reordered = [...reorderFunDecls('main', deps)]
        .map(f => funs.get(f) as CoreFuncDecl);

    return exprOfFunDeclsAux(reordered);
};

const partialLetRecIn = (f: CoreFuncDecl): CoreLetRecInExpr => {
    const [x, xs] = decons(f.args);

    return {
        type: 'let_rec_in',
        arg: x,
        funName: f.name,
        middle: xs.length === 0 ? f.body : lambdaOf(xs, f.body),
        right: {} as CoreExpr
    };
};

const partialLetIn = (f: CoreFuncDecl): CoreLetInExpr => {
    return {
        type: 'let_in',
        left: f.name,
        middle: lambdaOf(f.args, f.body),
        right: {} as CoreExpr
    };
};

const partialFunOf = (f: CoreFuncDecl): CoreLetInExpr | CoreLetRecInExpr => {
    return isFunDeclRecursive(f) ? partialLetRecIn(f) : partialLetIn(f);
};

const exprOfFunDeclsAux = (funs: CoreFuncDecl[]) => {
    // only main
    if (funs.length === 1) return funs[0].body;

    const [f, fs] = decons(funs);
    const main = fs.pop() as CoreFuncDecl;

    const top = partialFunOf(f);

    const bottom = fs.reduce((prev, g) => {
        const next = partialFunOf(g);
        prev.right = next;
        return next;
    }, top);

    bottom.right = main.body;

    return top;
};

export const reorderFunDecls = (
    f: string,
    deps: Dependencies,
    order: Set<string> = new Set() // Sets preserve order in JS
): Set<string> => {
    if (order.has(f)) return order;

    for (const g of deps.get(f) ?? []) {
        reorderFunDecls(g, deps, order);
    }

    order.add(f);

    return order;
};

const cycles = (
    deps: Dependencies,
    f: string,
    visited: Set<string> = new Set(),
    foundCycles: Set<string> = new Set()
) => {
    if (visited.has(f)) {
        foundCycles.add(f);
        return foundCycles;
    }

    visited.add(f);

    for (const g of deps.get(f) ?? []) {
        cycles(deps, g, visited, foundCycles);
    }

    return foundCycles;
};

export const funcDeclsDependencies = (prog: CoreDecl[]): Dependencies => {
    const [
        funs,
        datatypes
    ] = partition(prog, d => d.type === 'fun') as [CoreFuncDecl[], DataTypeDecl[]];

    const env = varEnvOf(...dataTypeVariants(datatypes));

    const deps = new Map<string, Set<string>>();

    for (const f of funs) {
        const freeVars = coreFunDeclFreeVars(f, env);
        deps.set(f.name, freeVars);
    }

    return deps;
};

const dataTypeVariants = (typeDecls: DataTypeDecl[]): string[] => {
    const variants: string[] = [];

    for (const dt of typeDecls) {
        for (const variant of dt.variants) {
            variants.push(variant.name);
        }
    }

    return variants;
};

const isFunDeclRecursive = (f: CoreFuncDecl): boolean => {
    return coreExprFreeVars(f.body, varEnvOf(...f.args)).has(f.name);
};

export const coreFunDeclFreeVars = (f: CoreFuncDecl, env: VarEnv) => {
    return coreExprFreeVars(f.body, addEnv(env, f.name, ...f.args));
};

export const coreExprFreeVars = (
    e: CoreExpr,
    env: VarEnv = {},
    freeVars: Set<string> = new Set()
): Set<string> => {
    switch (e.type) {
        case 'variable': {
            if (!env[e.name]) {
                freeVars.add(e.name);
            }

            break;
        }
        case 'let_in': {
            const env2 = addEnv(env, e.left);
            coreExprFreeVars(e.middle, env2, freeVars);
            coreExprFreeVars(e.right, env2, freeVars);
            break;
        }
        case 'let_rec_in': {
            const env2 = addEnv(env, e.funName, e.arg);
            coreExprFreeVars(e.middle, env2, freeVars);
            coreExprFreeVars(e.right, env2, freeVars);
            break;
        }
        case 'binop': {
            coreExprFreeVars(e.left, env, freeVars);
            coreExprFreeVars(e.right, env, freeVars);
            break;
        }
        case 'app': {
            coreExprFreeVars(e.lhs, env, freeVars);
            coreExprFreeVars(e.rhs, env, freeVars);
            break;
        }
        case 'lambda': {
            coreExprFreeVars(e.body, addEnv(env, e.arg), freeVars);
            break;
        }
        case 'if_then_else': {
            coreExprFreeVars(e.cond, env, freeVars);
            coreExprFreeVars(e.thenBranch, env, freeVars);
            coreExprFreeVars(e.elseBranch, env, freeVars);
            break;
        }
        case 'case_of': {
            coreExprFreeVars(e.value, env, freeVars);

            for (const { pattern, expr } of e.cases) {
                const env2 = addEnv(env, ...vars(pattern));
                coreExprFreeVars(expr, env2, freeVars);
            }
            break;
        }
        case 'tyconst': {
            for (const expr of e.args) {
                coreExprFreeVars(expr, env, freeVars);
            }
            break;
        }
        case 'constant': { break; }
    }

    return freeVars;
};