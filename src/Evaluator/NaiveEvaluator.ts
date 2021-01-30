import { naiveJsProgramOf } from "../Compiler/NaiveJSCompiler/NaiveJSCompiler.ts";
import { typeCheck } from "../Inferencer/TypeCheck.ts";
import { MonoTy } from "../Inferencer/Types.ts";
import { parseProgram } from "../Parser/Program.ts";
import { bind, ok, Result } from "../Utils/Result.ts";

export const compileNaive = async (path: string): Promise<Result<[ty: MonoTy, js: string], string>> => {
    return bind(await parseProgram(path), prog => {
        return bind(typeCheck(prog), ({ ty, coreProg }) => {
            let js = naiveJsProgramOf(coreProg);
            js += '\n\nconsole.log(main);';
            return ok([ty, js]);
        });
    });
};