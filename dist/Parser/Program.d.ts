import { CoreDecl, CoreFuncDecl } from "../Core/CoreDecl";
import { Dependencies } from '../Core/ExprOfFunDecls';
import { Maybe } from "../Utils/Maybe";
import { Result, Unit } from "../Utils/Result";
import { DataTypeDecl, Decl, FuncDecl, InstanceDecl, TypeClassDecl } from "./Decl";
export declare type FileReader = (path: string) => Promise<string>;
export declare const nodeFileReader: FileReader;
export declare class Program {
    exports: Set<string>;
    imports: Map<string, Set<string>>;
    funcs: Map<string, FuncDecl[]>;
    datatypes: Map<string, DataTypeDecl>;
    typeclasses: Map<string, TypeClassDecl>;
    instances: InstanceDecl[];
    coreFuncs: Map<string, CoreFuncDecl>;
    variants: Map<string, string>;
    deps: Dependencies;
    path: string;
    constructor(decls: Decl[], path: string);
    hasFuncDecl(f: string): boolean;
    getCoreFuncDecl(f: string): Maybe<CoreFuncDecl>;
    private addFuncFrom;
    private gatherImports;
    addImports(reader: FileReader): Promise<Result<Unit, string>>;
    private collectImports;
    asCoreDecls(): CoreDecl[];
}
export declare const parseProgram: (path: string) => Promise<Result<Program, string>>;
