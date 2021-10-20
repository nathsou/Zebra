"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.coreExprFreeVars = exports.coreFunDeclFreeVars = exports.funcDeclsDependencies = exports.reorderFunDecls = exports.usedFuncDecls = exports.varEnvOf = exports.singleExprProgOf = exports.renameTyClassInstance = void 0;
const Primitives_1 = require("../Inferencer/Primitives");
const Types_1 = require("../Inferencer/Types");
const Pattern_1 = require("../Interpreter/Pattern");
const Expr_1 = require("../Parser/Expr");
const Sugar_1 = require("../Parser/Sugar");
const Common_1 = require("../Utils/Common");
const Casify_1 = require("./Casify");
const renameTyClassInstance = (method, ty, class_) => {
    return `${class_}_${Types_1.expandTy(ty).join('_')}_${method}`;
};
exports.renameTyClassInstance = renameTyClassInstance;
const funcDeclsOfTyClassInstance = (inst) => {
    const funcs = [];
    for (const [f, [id, func]] of inst.defs) {
        funcs.push({
            ...func,
            funName: {
                type: 'variable',
                name: exports.renameTyClassInstance(f, inst.ty, inst.class_),
                id
            }
        });
    }
    return funcs;
};
// returns a single expression representing the whole program
// which contains no global function declarations
// and where mutually-recursive functions have been
// rewritten to directly-recursive functions
const singleExprProgOf = (prog, includeUnusedDependencies = false) => {
    const funcs = [...prog.coreFuncs.values()];
    funcs.push(...prog.instances.map(funcDeclsOfTyClassInstance).flat());
    const deps = exports.funcDeclsDependencies(funcs, prog.datatypes.values());
    const mutuallyRec = mutuallyRecursiveFuncs(deps);
    const funs = new Map();
    for (const f of funcs) {
        funs.set(f.funName.name, f);
    }
    const mutuallyRecPartialFuncs = new Map();
    if (mutuallyRec.size > 0) {
        // each group of mutually recursive functions
        // is rewritten into a single expression
        // therefore dependencies have to be updated
        // accordingly
        for (const comp of connectedComponents(mutuallyRec)) {
            const [f, fs] = Common_1.decons(comp);
            // regroup all the group's dependencies together
            const compDeps = new Set([...comp.map(g => [...deps.get(g) ?? []])].flat());
            deps.set(f, compDeps);
            // rewrite the functions into a single expression
            mutuallyRecPartialFuncs.set(f, rewriteMutuallyRecursiveFuncs(comp.map(f => Common_1.defined(funs.get(f)))));
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
        const depsOfMain = Common_1.defined(deps.get('main'));
        for (const f of deps.keys()) {
            if (f !== 'main') {
                depsOfMain.add(f);
            }
        }
    }
    // reorder functions according to dependencies
    const reordered = [...exports.reorderFunDecls('main', deps)]
        .filter(f => funs.has(f))
        .map(f => Common_1.defined(funs.get(f)));
    return exprOfFunDeclsAux(reordered, mutuallyRecPartialFuncs);
};
exports.singleExprProgOf = singleExprProgOf;
const addEnvMut = (env, ...xs) => {
    for (const x of xs) {
        env[x] = true;
    }
    return env;
};
const addEnv = (env, ...xs) => addEnvMut({ ...env }, ...xs);
const varEnvOf = (...xs) => addEnvMut({}, ...xs);
exports.varEnvOf = varEnvOf;
const renameMutualRecFunc = (f) => `%${f}%`;
const ReplaceMe = Expr_1.varOf('ReplaceMe');
// suppose f and g are mutally recursive:
//      let rec f = \x -> body_f
//      and let rec g = \x -> body_g in ..
// then: let rec f' = \g -> \x -> let f = f' g in body_f in 
//          let rec g' = \x -> let g = g' in body_g
//       in ..
// is equivalent and directly recursive
const rewriteMutuallyRecursiveFunc = (f, 
// functions not yet in f's environment
undefinedFuncs, 
// accumulate the original function definitions
defs) => {
    const [x, xs] = Common_1.decons([
        ...undefinedFuncs,
        ...f.args
    ]);
    const f_ = Expr_1.varOf(renameMutualRecFunc(f.funName.name));
    const nextDef = {
        type: 'let_in',
        left: f.funName,
        middle: undefinedFuncs.length === 0 ?
            f_ :
            Casify_1.coreOf(Sugar_1.appOf(...[f_, ...undefinedFuncs])),
        right: ReplaceMe
    };
    if (defs.top === null || defs.bottom === null) {
        defs.top = nextDef;
        defs.bottom = defs.top;
    }
    else {
        nextDef.right = defs.top;
        defs.top = nextDef;
    }
    defs.bottom.right = f.body;
    const defsSection = Common_1.deepCopy(defs.top);
    const middle = xs.length > 0 ? Sugar_1.lambdaOf(xs, defsSection) : defsSection;
    return {
        type: 'let_rec_in',
        funName: f_,
        arg: x,
        middle,
        right: ReplaceMe
    };
};
const rewriteMutuallyRecursiveFuncs = (funcs) => {
    Common_1.assert(funcs.length > 1);
    const [f, fs] = Common_1.decons(funcs);
    const remaining = fs.map(f => f.funName);
    const defs = { top: null, bottom: null };
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
const partialLetRecIn = (f) => {
    const [x, xs] = Common_1.decons(f.args);
    return {
        type: 'let_rec_in',
        arg: x,
        funName: f.funName,
        middle: xs.length === 0 ? f.body : Sugar_1.lambdaOf(xs, f.body),
        right: ReplaceMe
    };
};
const partialLetIn = (f) => {
    return {
        type: 'let_in',
        left: f.funName,
        middle: Sugar_1.lambdaOf(f.args, f.body),
        right: ReplaceMe
    };
};
const attachRight = (to, by) => {
    if (to.right.type === 'variable' && to.right.name === ReplaceMe.name) {
        to.right = by;
    }
    else {
        Common_1.assert(to.right.type === 'let_in' || to.right.type === 'let_rec_in');
        attachRight(to.right, by);
    }
};
const partialFunOf = (f, mutuallyRecPartialFuncs) => {
    // nullary function declarations are just constant declarations
    if (f.args.length === 0) {
        return {
            type: 'let_in',
            left: f.funName,
            middle: f.body,
            right: ReplaceMe
        };
    }
    if (mutuallyRecPartialFuncs.has(f.funName.name)) {
        return Common_1.defined(mutuallyRecPartialFuncs.get(f.funName.name));
    }
    return isFunDeclRecursive(f) ? partialLetRecIn(f) : partialLetIn(f);
};
const exprOfFunDeclsAux = (funs, mutuallyRecPartialFuncs) => {
    // only main
    if (funs.length === 1)
        return funs[0].body;
    const [f, fs] = Common_1.decons(funs);
    const main = Common_1.defined(fs.pop());
    const top = partialFunOf(f, mutuallyRecPartialFuncs);
    const bottom = fs.reduce((prev, g) => {
        const next = partialFunOf(g, mutuallyRecPartialFuncs);
        attachRight(prev, next);
        return next;
    }, top);
    attachRight(bottom, main.body);
    return top;
};
const usedFuncDecls = (f, deps, used = new Set()) => {
    if (used.has(f))
        return used;
    used.add(f);
    for (const g of deps.get(f) ?? []) {
        exports.usedFuncDecls(g, deps, used);
    }
    return used;
};
exports.usedFuncDecls = usedFuncDecls;
const reorderFunDecls = (f, deps, order = new Set() // Sets preserve order in JS
) => {
    if (order.has(f))
        return order;
    for (const g of deps.get(f) ?? []) {
        exports.reorderFunDecls(g, deps, order);
    }
    order.add(f);
    return order;
};
exports.reorderFunDecls = reorderFunDecls;
// Depth-first search
const dfs = (node, graph, visited = new Set()) => {
    const component = [];
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
const connectedComponents = (graph) => {
    const components = [];
    const visited = new Set();
    for (const node of graph.keys()) {
        if (!visited.has(node)) {
            const component = dfs(node, graph, visited);
            components.push(component);
        }
    }
    return components;
};
// checks if two nodes in a graph are connected
const nodesConnected = (a, b, graph, visited = new Set()) => {
    if (a === b)
        return true;
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
const coRecursiveFuncs = (f, deps) => {
    const coRecursive = new Set();
    for (const g of deps.get(f) ?? []) {
        if (nodesConnected(g, f, deps)) {
            coRecursive.add(g);
        }
    }
    return coRecursive;
};
const mutuallyRecursiveFuncs = (deps) => {
    const graph = new Map();
    for (const f of deps.keys()) {
        const coRecursive = coRecursiveFuncs(f, deps);
        if (coRecursive.size > 0) {
            graph.set(f, coRecursive);
        }
    }
    return graph;
};
const funcDeclsDependencies = (funDecls, dataTypeDecls) => {
    const env = exports.varEnvOf(...envBoundVars(dataTypeDecls));
    const deps = new Map();
    for (const f of funDecls) {
        const freeVars = exports.coreFunDeclFreeVars(f, env);
        deps.set(f.funName.name, freeVars);
    }
    return deps;
};
exports.funcDeclsDependencies = funcDeclsDependencies;
const envBoundVars = (dataTypeDecl) => {
    const boundVars = [];
    for (const dt of dataTypeDecl) {
        for (const variant of dt.variants) {
            boundVars.push(variant.name);
        }
    }
    boundVars.push(...Primitives_1.primitives.keys());
    return boundVars;
};
const isFunDeclRecursive = (f) => {
    return exports.coreExprFreeVars(f.body, exports.varEnvOf(...f.args.map(v => v.name))).has(f.funName.name);
};
const coreFunDeclFreeVars = (f, env) => {
    return exports.coreExprFreeVars(f.body, addEnv(env, f.funName.name, ...f.args.map(v => v.name)));
};
exports.coreFunDeclFreeVars = coreFunDeclFreeVars;
const coreExprFreeVars = (e, env = {}, freeVars = new Set()) => {
    switch (e.type) {
        case 'variable': {
            if (!env[e.name]) {
                freeVars.add(e.name);
            }
            break;
        }
        case 'let_in': {
            const env2 = addEnv(env, e.left.name);
            exports.coreExprFreeVars(e.middle, env2, freeVars);
            exports.coreExprFreeVars(e.right, env2, freeVars);
            break;
        }
        case 'let_rec_in': {
            const env2 = addEnv(env, e.funName.name, e.arg.name);
            exports.coreExprFreeVars(e.middle, env2, freeVars);
            exports.coreExprFreeVars(e.right, env2, freeVars);
            break;
        }
        case 'app': {
            exports.coreExprFreeVars(e.lhs, env, freeVars);
            exports.coreExprFreeVars(e.rhs, env, freeVars);
            break;
        }
        case 'lambda': {
            exports.coreExprFreeVars(e.body, addEnv(env, e.arg.name), freeVars);
            break;
        }
        case 'if_then_else': {
            exports.coreExprFreeVars(e.cond, env, freeVars);
            exports.coreExprFreeVars(e.thenBranch, env, freeVars);
            exports.coreExprFreeVars(e.elseBranch, env, freeVars);
            break;
        }
        case 'case_of': {
            exports.coreExprFreeVars(e.value, env, freeVars);
            for (const { pattern, expr } of e.cases) {
                const env2 = addEnv(env, ...[...Pattern_1.vars(pattern)].map(v => v.value));
                exports.coreExprFreeVars(expr, env2, freeVars);
            }
            break;
        }
        case 'tyconst': {
            for (const expr of e.args) {
                exports.coreExprFreeVars(expr, env, freeVars);
            }
            break;
        }
        case 'constant': {
            break;
        }
    }
    return freeVars;
};
exports.coreExprFreeVars = coreExprFreeVars;
