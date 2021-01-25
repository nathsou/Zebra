import { assert } from "https://deno.land/std@0.83.0/testing/asserts.ts";
import { isTyVar, MonoTy, TyConst } from "../Inferencer/Types.ts";
import { vars } from "../Interpreter/Pattern.ts";
import { DataTypeDecl, InstanceDecl } from "../Parser/Decl.ts";
import { appOf, lambdaOf } from "../Parser/Sugar.ts";
import { decons, deepCopy, defined } from "../Utils/Common.ts";
import { coreOf, reducePatternMatchingToCaseOf } from "./Casify.ts";
import { CoreFuncDecl, PartitionedDecls, SingleExprProg } from "./CoreDecl.ts";
import { CoreExpr, CoreLetInExpr, CoreLetRecInExpr, CoreVarExpr } from "./CoreExpr.ts";

type VarEnv = { [key: string]: true };
type Graph<T> = Map<T, Set<T>>;
type Dependencies = Graph<string>;

const expandTy = (ty: MonoTy, acc: string[] = []) => {
    if (isTyVar(ty)) return acc;

    acc.push(ty.name);

    for (const arg of ty.args) {
        expandTy(arg, acc);
    }

    return acc;
};

export const renameTyClassInstance = (
    method: string,
    ty: TyConst,
    class_: string
): string => {
    return `${class_}_${expandTy(ty).join('_')}_${method}`;
};

const funcDeclsOfTyClassInstance = (inst: InstanceDecl) => {
    const funcs: CoreFuncDecl[] = [];

    for (const [f, func] of inst.defs) {
        funcs.push(reducePatternMatchingToCaseOf({
            ...func,
            name: renameTyClassInstance(
                f,
                inst.ty,
                inst.class_
            )
        }));
    }

    return funcs;
};

// returns a single expression representing the whole program
// which contains no global function declarations
// and where mutually-recursive functions have been
// rewritten to directly-recursive functions
export const singleExprProgOf = (
    decls: PartitionedDecls,
    includeUnusedDependencies = false
): SingleExprProg => {

    const funcs = [...decls.funcDecls];

    funcs.push(...decls.instanceDecls.map(funcDeclsOfTyClassInstance).flat());

    const deps = funcDeclsDependencies(funcs, decls.dataTypeDecls);
    const mutuallyRec = mutuallyRecursiveFuncs(deps);

    const funs = new Map<string, CoreFuncDecl>();

    for (const f of funcs) {
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
                    comp.map(f => defined(funs.get(f)))
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

    // include unused dependencies (for type-cheking for instance)
    if (includeUnusedDependencies) {
        const depsOfMain = defined(deps.get('main'));

        for (const f of deps.keys()) {
            if (f !== 'main') {
                depsOfMain.add(f);
            }
        }
    }

    // reorder functions according to dependencies
    const reordered = [...reorderFunDecls('main', deps)]
        .filter(f => funs.has(f))
        .map(f => defined(funs.get(f)));

    return {
        typeDecls: [...decls.dataTypeDecls, ...decls.typeClassDecls, ...decls.instanceDecls],
        main: exprOfFunDeclsAux(reordered, mutuallyRecPartialFuncs)
    };
};

const addEnvMut = (env: VarEnv, ...xs: string[]): VarEnv => {
    for (const x of xs) {
        env[x] = true;
    }

    return env;
};

const addEnv = (env: VarEnv, ...xs: string[]) => addEnvMut({ ...env }, ...xs);
export const varEnvOf = (...xs: string[]) => addEnvMut({}, ...xs);

const renameMutualRecFunc = (f: string) => `%${f}%`;

const varOf = (x: string): CoreVarExpr => ({ type: 'variable', name: x });

const ReplaceMe = varOf('ReplaceMe');

// suppose f and g are mutally recursive:
//      let rec f = \x -> body_f
//      and let rec g = \x -> body_g in ..

// then: let rec f' = \g -> \x -> let f = f' g in body_f in 
//          let rec g' = \x -> let g = g' in body_g
//       in ..
// is equivalent and directly recursive
const rewriteMutuallyRecursiveFunc = (
    f: CoreFuncDecl,
    // functions not yet in f's environment
    undefinedFuncs: Readonly<string[]>,
    // accumulate the original function definitions
    defs: { top: CoreLetInExpr | null, bottom: CoreLetInExpr | null }
): CoreLetRecInExpr => {
    const [x, xs] = decons([
        ...undefinedFuncs,
        ...f.args
    ]);

    const f_ = renameMutualRecFunc(f.name);

    const nextDef: CoreLetInExpr = {
        type: 'let_in',
        left: f.name,
        middle: undefinedFuncs.length === 0 ?
            varOf(f_) :
            coreOf(appOf(...[f_, ...undefinedFuncs].map(varOf))),
        right: ReplaceMe
    };

    if (defs.top === null || defs.bottom === null) {
        defs.top = nextDef;
        defs.bottom = defs.top;
    } else {
        nextDef.right = defs.top;
        defs.top = nextDef;
    }

    defs.bottom.right = f.body;

    const defsSection = deepCopy(defs.top);

    const middle = xs.length > 0 ? lambdaOf(xs, defsSection) : defsSection;

    return {
        type: 'let_rec_in',
        funName: f_,
        arg: x,
        middle,
        right: ReplaceMe
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
        defs.bottom.right = ReplaceMe;
        bottom.right = defs.top;
    }

    return top;
};

const partialLetRecIn = (f: CoreFuncDecl): CoreLetRecInExpr => {
    const [x, xs] = decons(f.args);

    return {
        type: 'let_rec_in',
        arg: x,
        funName: f.name,
        middle: xs.length === 0 ? f.body : lambdaOf(xs, f.body),
        right: ReplaceMe
    };
};

const partialLetIn = (f: CoreFuncDecl): CoreLetInExpr => {
    return {
        type: 'let_in',
        left: f.name,
        middle: lambdaOf(f.args, f.body),
        right: ReplaceMe
    };
};

const attachRight = (to: CoreLetInExpr | CoreLetRecInExpr, by: CoreExpr): void => {
    if (to.right.type === 'variable' && to.right.name === ReplaceMe.name) {
        to.right = by;
    } else {
        assert(to.right.type === 'let_in' || to.right.type === 'let_rec_in');
        attachRight(to.right, by);
    }
};

const partialFunOf = (
    f: CoreFuncDecl,
    mutuallyRecPartialFuncs: Map<string, CoreLetRecInExpr>
): CoreLetInExpr | CoreLetRecInExpr => {
    // nullary function declarations are just constant declarations
    if (f.args.length === 0) {
        return {
            type: 'let_in',
            left: f.name,
            middle: f.body,
            right: ReplaceMe
        };
    }

    if (mutuallyRecPartialFuncs.has(f.name)) {
        return defined(mutuallyRecPartialFuncs.get(f.name));
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
    const main = defined(fs.pop());

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
    order = new Set<string>() // Sets preserve order in JS
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

// checks if two nodes in a graph are connected
const nodesConnected = <T>(a: T, b: T, graph: Graph<T>, visited = new Set<T>()): boolean => {
    if (a === b) return true;
    visited.add(a);

    for (const adj of graph.get(a) ?? []) {
        if (!visited.has(adj)) {
            if (nodesConnected(adj, b, graph, visited)) {
                return true;
            }
        }
    }

    return false;
};

const coRecursiveFuncs = (f: string, deps: Dependencies): Set<string> => {
    const coRecursive = new Set<string>();

    for (const g of deps.get(f) ?? []) {
        if (nodesConnected(g, f, deps)) {
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

const dataTypeVariants = (dataTypeDecl: DataTypeDecl[]): string[] => {
    const variants: string[] = [];

    for (const dt of dataTypeDecl) {
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