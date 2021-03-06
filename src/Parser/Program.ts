import { assert } from "https://deno.land/std@0.83.0/testing/asserts.ts";
import { dirname, resolve } from "https://deno.land/std@0.85.0/path/mod.ts";
import { casifyFunctionDeclarations, groupByHead } from "../Core/Casify.ts";
import { CoreDecl, CoreFuncDecl } from "../Core/CoreDecl.ts";
import { Dependencies, funcDeclsDependencies } from '../Core/ExprOfFunDecls.ts';
import { defined } from "../Utils/Common.ts";
import { Maybe } from "../Utils/Maybe.ts";
import { bind, bindWith, error, isError, ok, Result, Unit } from "../Utils/Result.ts";
import { parse } from "./Combinators.ts";
import { DataTypeDecl, Decl, FuncDecl, InstanceDecl, TypeClassDecl } from "./Decl.ts";
import { program } from "./Parser.ts";

export type FileReader = (path: string) => Promise<string>;

export const denoFileReader: FileReader = async (path: string) => {
    return Deno.readTextFile(path);
};

export class Program {
    public exports = new Set<string>();
    public imports = new Map<string, Set<string>>();
    public funcs: Map<string, FuncDecl[]>;
    public datatypes = new Map<string, DataTypeDecl>();
    public typeclasses = new Map<string, TypeClassDecl>();
    public instances: InstanceDecl[] = [];
    public coreFuncs = new Map<string, CoreFuncDecl>();
    public variants = new Map<string, string>();
    public deps: Dependencies;
    public path: string;

    constructor(decls: Decl[], path: string) {
        this.path = path;
        const funcs: FuncDecl[] = [];

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

        this.funcs = groupByHead(funcs);
        this.coreFuncs = casifyFunctionDeclarations(this.funcs);
        this.deps = funcDeclsDependencies(
            this.coreFuncs.values(),
            []
        );
    }

    public hasFuncDecl(f: string): boolean {
        return this.funcs.has(f);
    }

    public getCoreFuncDecl(f: string): Maybe<CoreFuncDecl> {
        return this.coreFuncs.get(f);
    }

    private addFuncFrom(name: string, p: Program): void {
        assert(!this.funcs.has(name));
        assert(p.funcs.has(name));

        this.funcs.set(name, defined(p.funcs.get(name)));
        this.coreFuncs.set(name, defined(p.coreFuncs.get(name)));
    }

    private gatherImports(
        p: Program,
        imports: Set<string>
    ): Result<Unit, string> {
        const imported = new Set<string>();
        const stack: string[] = [...imports];

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
            const f = defined(stack.pop());
            if (imported.has(f)) {
                continue;
            }

            if (imports.has(f) && !p.exports.has(f) && !p.variants.has(f)) {
                return error(`"${p.path}" has no exported member named "${f}"`);
            }

            if (this.funcs.has(f)) {
                return error(`imported member '${f}' already exists`);
            }

            if (p.funcs.has(f)) {
                this.addFuncFrom(f, p);

                for (const g of p.deps.get(f) ?? []) {
                    stack.push(g);
                }

            } else if (p.datatypes.has(f)) {
                if (!this.datatypes.has(f)) {
                    this.datatypes.set(f, defined(p.datatypes.get(f)));
                }
            } else if (p.typeclasses.has(f)) {
                if (!this.typeclasses.has(f)) {
                    this.typeclasses.set(f, defined(p.typeclasses.get(f)));
                }
            } else if (p.variants.has(f)) {
                const datatype = defined(p.variants.get(f));
                if (!this.datatypes.has(datatype)) {
                    this.datatypes.set(datatype, defined(p.datatypes.get(datatype)));
                }
            } else {
                return error(`'${f}' is not defined in "${p.path}"`);
            }

            imported.add(f);
        }

        return ok('()');
    }

    public async addImports(reader: FileReader): Promise<Result<Unit, string>> {
        const programs = new Map<string, Program>();
        const res = await this.collectImports(reader, programs);

        this.instances = this.instances
            .filter(inst => this.typeclasses.has(inst.class_));

        return res;
    }

    private async collectImports(
        reader: FileReader,
        programs: Map<string, Program>
    ): Promise<Result<Unit, string>> {
        const prevDir = Deno.cwd();
        Deno.chdir(dirname(this.path));

        // console.log(this.path);

        for (const [path, imports] of this.imports.entries()) {
            const absolutePath = resolve(path);
            try {
                const source = await reader(absolutePath);

                const prog = programs.has(absolutePath) ?
                    ok(defined(programs.get(absolutePath))) :
                    bindWith(
                        parse(source, program),
                        decls => new Program(decls, absolutePath)
                    );

                if (isError(prog)) return prog;

                if (!programs.has(absolutePath)) {
                    programs.set(absolutePath, prog.value);
                }

                const addImportsRes = await prog.value.collectImports(
                    reader,
                    programs
                );

                if (isError(addImportsRes)) return addImportsRes;

                const gatherRes = this.gatherImports(
                    prog.value,
                    imports
                );

                if (isError(gatherRes)) return gatherRes;

            } catch (e) {
                return error(`Could not import "${absolutePath}"`);
            }
        }

        Deno.chdir(prevDir);

        return ok('()');
    }

    public asCoreDecls(): CoreDecl[] {
        return [
            ...this.coreFuncs.values(),
            ...this.datatypes.values(),
            ...this.typeclasses.values(),
            ...this.instances
        ];
    }

}

export const parseProgram = async (path: string): Promise<Result<Program, string>> => {
    try {
        const absolutePath = resolve(path);
        const source = await denoFileReader(absolutePath);
        const decls = parse(source, program);
        if (isError(decls)) return decls;

        const prog = new Program(decls.value, absolutePath);
        return bind(await prog.addImports(denoFileReader), () => ok(prog));
    } catch (e) {
        return error(`Could not import "${path}": ${e}`);
    }
};