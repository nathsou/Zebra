"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseProgram = exports.Program = exports.nodeFileReader = void 0;
const promises_1 = require("fs/promises");
const path_1 = require("path");
const process_1 = require("process");
const Casify_1 = require("../Core/Casify");
const ExprOfFunDecls_1 = require("../Core/ExprOfFunDecls");
const Common_1 = require("../Utils/Common");
const Result_1 = require("../Utils/Result");
const Combinators_1 = require("./Combinators");
const Parser_1 = require("./Parser");
const nodeFileReader = async (path) => {
    return await promises_1.readFile(path, 'utf8');
};
exports.nodeFileReader = nodeFileReader;
class Program {
    constructor(decls, path) {
        this.exports = new Set();
        this.imports = new Map();
        this.datatypes = new Map();
        this.typeclasses = new Map();
        this.instances = [];
        this.coreFuncs = new Map();
        this.variants = new Map();
        this.path = path;
        const funcs = [];
        for (const d of decls) {
            switch (d.type) {
                case 'fun':
                    funcs.push(d);
                    break;
                case 'import':
                    this.imports.set(d.path, new Set(d.imports));
                    break;
                case 'export':
                    for (const exp of d.exports) {
                        this.exports.add(exp);
                    }
                    break;
                case 'datatype':
                    this.datatypes.set(d.name, d);
                    for (const variant of d.variants) {
                        this.variants.set(variant.name, d.name);
                    }
                    break;
                case 'typeclass':
                    this.typeclasses.set(d.name, d);
                    break;
                case 'instance':
                    this.instances.push(d);
                    break;
            }
        }
        this.funcs = Casify_1.groupByHead(funcs);
        this.coreFuncs = Casify_1.casifyFunctionDeclarations(this.funcs);
        this.deps = ExprOfFunDecls_1.funcDeclsDependencies(this.coreFuncs.values(), []);
    }
    hasFuncDecl(f) {
        return this.funcs.has(f);
    }
    getCoreFuncDecl(f) {
        return this.coreFuncs.get(f);
    }
    addFuncFrom(name, p) {
        Common_1.assert(!this.funcs.has(name));
        Common_1.assert(p.funcs.has(name));
        this.funcs.set(name, Common_1.defined(p.funcs.get(name)));
        this.coreFuncs.set(name, Common_1.defined(p.coreFuncs.get(name)));
    }
    gatherImports(p, imports) {
        const imported = new Set();
        const stack = [...imports];
        this.instances.push(...p.instances);
        // add instances and their dependencies
        // TODO: add dependencies from instances
        // const defaultEnv = varEnvOf(
        //     ...p.variants.keys(),
        //     ...this.variants.keys(),
        //     ...primitives.keys()
        // );
        for (const inst of p.instances) {
            this.instances.push(inst);
            // for (const [_, decl] of inst.defs.values()) {
            //     const freeVars = coreFunDeclFreeVars(decl, defaultEnv);
            //     for (const fv of freeVars) {
            //         if (!imported.has(fv)) {
            //             console.log('instadd', inst.class_, showMonoTy(inst.ty), fv);
            //             stack.push(fv);
            //         }
            //     }
            // }
        }
        while (stack.length !== 0) {
            const f = Common_1.defined(stack.pop());
            if (imported.has(f)) {
                continue;
            }
            if (imports.has(f) && !p.exports.has(f) && !p.variants.has(f)) {
                return Result_1.error(`"${p.path}" has no exported member named "${f}"`);
            }
            if (this.funcs.has(f)) {
                return Result_1.error(`imported member '${f}' already exists`);
            }
            if (p.funcs.has(f)) {
                this.addFuncFrom(f, p);
                for (const g of p.deps.get(f) ?? []) {
                    stack.push(g);
                }
            }
            else if (p.datatypes.has(f)) {
                if (!this.datatypes.has(f)) {
                    this.datatypes.set(f, Common_1.defined(p.datatypes.get(f)));
                }
            }
            else if (p.typeclasses.has(f)) {
                if (!this.typeclasses.has(f)) {
                    this.typeclasses.set(f, Common_1.defined(p.typeclasses.get(f)));
                }
            }
            else if (p.variants.has(f)) {
                const datatype = Common_1.defined(p.variants.get(f));
                if (!this.datatypes.has(datatype)) {
                    this.datatypes.set(datatype, Common_1.defined(p.datatypes.get(datatype)));
                }
            }
            else {
                return Result_1.error(`'${f}' is not defined in "${p.path}"`);
            }
            imported.add(f);
        }
        return Result_1.ok('()');
    }
    async addImports(reader) {
        const programs = new Map();
        const res = await this.collectImports(reader, programs);
        this.instances = this.instances
            .filter(inst => this.typeclasses.has(inst.class_));
        return res;
    }
    async collectImports(reader, programs) {
        const prevDir = process_1.cwd();
        process_1.chdir(path_1.dirname(this.path));
        for (const [path, imports] of this.imports.entries()) {
            const absolutePath = path_1.resolve(path);
            try {
                const source = await reader(absolutePath);
                const prog = programs.has(absolutePath) ?
                    Result_1.ok(Common_1.defined(programs.get(absolutePath))) :
                    Result_1.bindWith(Combinators_1.parse(source, Parser_1.program), decls => new Program(decls, absolutePath));
                if (Result_1.isError(prog))
                    return prog;
                if (!programs.has(absolutePath)) {
                    programs.set(absolutePath, prog.value);
                }
                const addImportsRes = await prog.value.collectImports(reader, programs);
                if (Result_1.isError(addImportsRes))
                    return addImportsRes;
                const gatherRes = this.gatherImports(prog.value, imports);
                if (Result_1.isError(gatherRes))
                    return gatherRes;
            }
            catch (e) {
                return Result_1.error(`Could not import "${absolutePath}"`);
            }
        }
        process_1.chdir(prevDir);
        return Result_1.ok('()');
    }
    asCoreDecls() {
        return [
            ...this.coreFuncs.values(),
            ...this.datatypes.values(),
            ...this.typeclasses.values(),
            ...this.instances
        ];
    }
}
exports.Program = Program;
const parseProgram = async (path) => {
    try {
        const absolutePath = path_1.resolve(path);
        const source = await exports.nodeFileReader(absolutePath);
        const decls = Combinators_1.parse(source, Parser_1.program);
        if (Result_1.isError(decls))
            return decls;
        const prog = new Program(decls.value, absolutePath);
        return Result_1.bind(await prog.addImports(exports.nodeFileReader), () => Result_1.ok(prog));
    }
    catch (e) {
        return Result_1.error(`Could not import "${path}": ${e}`);
    }
};
exports.parseProgram = parseProgram;
