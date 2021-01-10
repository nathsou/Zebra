import { assert } from "https://deno.land/std@0.83.0/testing/asserts.ts";
import { vars } from "../Interpreter/Pattern.ts";
import { DataTypeDecl } from "../Parser/Decl.ts";
import { appOf, lambdaOf } from "../Parser/Sugar.ts";
import { decons, deepCopy, partition } from "../Utils/Common.ts";
import { coreOf } from "./Casify.ts";
import { CoreDecl, CoreFuncDecl, SingleExprProg } from "./CoreDecl.ts";
import { CoreExpr, CoreLetInExpr, CoreLetRecInExpr, CoreVarExpr } from "./CoreExpr.ts";

type VarEnv = { [key: string]: true };
type Graph<T> = Map<T, Set<T>>;
type Dependencies = Graph<string>;

const addEnvMut = (env: VarEnv, ...xs: string[]): VarEnv => {
    for (const x of xs) {
        env[x] = true;
    }

    return env;
};

const addEnv = (env: VarEnv, ...xs: string[]) => addEnvMut({ ...env }, ...xs);
const varEnvOf = (...xs: string[]) => addEnvMut({}, ...xs);

const renameMutualRecFunc = (f: string) => `%${f}%`;

const varOf = (x: string): CoreVarExpr => ({ type: 'variable', name: x });

const rewriteMutuallyRecursiveFunc = (
    f: CoreFuncDecl,
    undef: Readonly<string[]>,
    defs: { top: CoreLetInExpr | null, bottom: CoreLetInExpr | null }
): CoreLetRecInExpr => {
    const [x, xs] = decons([
        ...undef,
        ...f.args
    ]);

    const f_ = renameMutualRecFunc(f.name);

    const nextLetIn: CoreLetInExpr = {
        type: 'let_in',
        left: f.name,
        middle: undef.length === 0 ?
            varOf(f_) :
            coreOf(appOf(...[f_, ...undef].map(varOf))),
        right: varOf('ReplaceMe')
    };

    if (defs.top === null || defs.bottom === null) {
        defs.top = nextLetIn;
        defs.bottom = defs.top;
    } else {
        nextLetIn.right = defs.top;
        defs.top = nextLetIn;
    }

    defs.bottom.right = f.body;

    const defsSection = deepCopy(defs.top);

    const middle = xs.length > 0 ? lambdaOf(xs, defsSection) : defsSection;

    return {
        type: 'let_rec_in',
        funName: f_,
        arg: x,
        middle,
        right: varOf('ReplaceMe')
    };
};

const rewriteMutuallyRecursiveFuncs = (
    funcs: CoreFuncDecl[]
): CoreLetRecInExpr => {
    assert(funcs.length > 1);
    const [f, fs] = decons(funcs);

    const remaining = fs.map(f => f.name);
    const defs: {
        top: CoreLetInExpr | null,
        bottom: CoreLetInExpr | null
    } = { top: null, bottom: null };

    const top = rewriteMutuallyRecursiveFunc(f, remaining, defs);

    const bottom = fs.reduce((prev, f) => {
        remaining.shift();
        const next = rewriteMutuallyRecursiveFunc(f, remaining, defs);
        prev.right = next;
        return next;
    }, top);

    if (defs.top !== null && defs.bottom !== null) {
        defs.bottom.right = varOf('ReplaceMe');
        bottom.right = defs.top;
    }

    return top;
};

// returns a single expression representing the whole program
// which contains no global function declarations
// and where mutually-recursive functions have been
// rewritten to directly-recursive functions
export const singleExprProgOf = (prog: CoreDecl[]): SingleExprProg => {
    const [
        funDecls,
        dataTypeDecls
    ] = partition(prog, d => d.type === 'fun') as [CoreFuncDecl[], DataTypeDecl[]];

    const deps = funcDeclsDependencies(funDecls, dataTypeDecls);
    const mutuallyRec = mutuallyRecursiveFuncs(deps);

    const funs = new Map<string, CoreFuncDecl>();

    for (const f of funDecls) {
        funs.set(f.name, f);
    }

    const mutuallyRecPartialFuncs = new Map<string, CoreLetRecInExpr>();

    if (mutuallyRec.size > 0) {
        // each group of mutually recursive functions
        // is rewritten into a single expression
        // therefore dependencies have to be updated
        // accordingly
        for (const comp of connectedComponents(mutuallyRec)) {
            const [f, fs] = decons(comp);

            // regroup all the group's dependencies together
            const compDeps = new Set<string>(
                [...comp.map(g => [...deps.get(g) ?? []])].flat()
            );

            deps.set(f, compDeps);

            // rewrite the functions into a single expression
            mutuallyRecPartialFuncs.set(
                f,
                rewriteMutuallyRecursiveFuncs(
                    comp.map(f => funs.get(f)) as CoreFuncDecl[]
                )
            );

            // update the dependencies
            for (const g of fs) {
                // g does not exist anymore
                deps.delete(g);
                funs.delete(g);

                for (const d of deps.values()) {
                    // replace g by f
                    if (d.has(g)) {
                        d.delete(g);
                        d.add(f);
                    }
                }
            }

            deps.get(f)?.delete(f);
        }
    }

    const reordered = [...reorderFunDecls('main', deps)]
        .filter(f => funs.has(f))
        .map(f => funs.get(f) as CoreFuncDecl);

    return {
        datatypes: dataTypeDecls,
        main: exprOfFunDeclsAux(reordered, mutuallyRecPartialFuncs)
    };
};

const partialLetRecIn = (f: CoreFuncDecl): CoreLetRecInExpr => {
    const [x, xs] = decons(f.args);

    return {
        type: 'let_rec_in',
        arg: x,
        funName: f.name,
        middle: xs.length === 0 ? f.body : lambdaOf(xs, f.body),
        right: varOf('ReplaceMe')
    };
};

const partialLetIn = (f: CoreFuncDecl): CoreLetInExpr => {
    return {
        type: 'let_in',
        left: f.name,
        middle: lambdaOf(f.args, f.body),
        right: varOf('ReplaceMe')
    };
};

const attachRight = (expr: CoreLetInExpr | CoreLetRecInExpr, right: CoreExpr): void => {
    if (expr.right.type === 'variable' && expr.right.name === 'ReplaceMe') {
        expr.right = right;
        return;
    }

    assert(expr.right.type === 'let_in' || expr.right.type === 'let_rec_in');
    attachRight(expr.right, right);
};

const partialFunOf = (
    f: CoreFuncDecl,
    mutuallyRecPartialFuncs: Map<string, CoreLetRecInExpr>
): CoreLetInExpr | CoreLetRecInExpr => {
    if (mutuallyRecPartialFuncs.has(f.name)) {
        return mutuallyRecPartialFuncs.get(f.name) as CoreLetRecInExpr;
    }

    return isFunDeclRecursive(f) ? partialLetRecIn(f) : partialLetIn(f);
};

const exprOfFunDeclsAux = (
    funs: CoreFuncDecl[],
    mutuallyRecPartialFuncs: Map<string, CoreLetRecInExpr>
) => {
    // only main
    if (funs.length === 1) return funs[0].body;

    const [f, fs] = decons(funs);
    const main = fs.pop() as CoreFuncDecl;

    const top = partialFunOf(f, mutuallyRecPartialFuncs);

    const bottom = fs.reduce((prev, g) => {
        const next = partialFunOf(g, mutuallyRecPartialFuncs);
        attachRight(prev, next);
        return next;
    }, top);

    attachRight(bottom, main.body);

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

// Depth-first search
const dfs = <T>(
    node: T,
    graph: Graph<T>,
    visited = new Set<T>()
): T[] => {
    const component: T[] = [];
    component.push(node);
    visited.add(node);

    for (const adj of graph.get(node) ?? []) {
        if (!visited.has(adj)) {
            component.push(...dfs(adj, graph, visited));
        }
    }

    return component;
};

// https://cp-algorithms.com/graph/search-for-connected-components.html
const connectedComponents = <T>(graph: Graph<T>): T[][] => {
    const components: T[][] = [];
    const visited = new Set<T>();

    for (const node of graph.keys()) {
        if (!visited.has(node)) {
            const component = dfs(node, graph, visited);
            components.push(component);
        }
    }

    return components;
};

const coRecursiveFuncs = (f: string, deps: Dependencies): Set<string> => {
    const coRecursive = new Set<string>();

    for (const g of deps.get(f) ?? []) {
        if (deps.get(g)?.has(f)) {
            coRecursive.add(g);
        }
    }

    return coRecursive;
};

const mutuallyRecursiveFuncs = (deps: Dependencies): Graph<string> => {
    const graph = new Map<string, Set<string>>();

    for (const f of deps.keys()) {
        const coRecursive = coRecursiveFuncs(f, deps);
        if (coRecursive.size > 0) {
            graph.set(f, coRecursive);
        }
    }

    return graph;
};

export const funcDeclsDependencies = (
    funDecls: CoreFuncDecl[],
    dataTypeDecls: DataTypeDecl[]
): Dependencies => {

    const env = varEnvOf(...dataTypeVariants(dataTypeDecls));

    const deps = new Map<string, Set<string>>();

    for (const f of funDecls) {
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