import { naiveJsProgramOf } from "../Compiler/NaiveJSCompiler/NaiveJSCompiler.ts";
import { typeCheck } from "../Inferencer/TypeCheck.ts";
import { MonoTy } from "../Inferencer/Types.ts";
import { parse } from "../Parser/Combinators.ts";
import { program } from "../Parser/Parser.ts";
import { ok, Result, bind } from "../Utils/Result.ts";

export const compileNaive = (source: string): Result<[ty: MonoTy, js: string], string> => {
    return bind(parse(source, program), prog => {
        return bind(typeCheck(prog), ({ ty, coreProg }) => {
            let js = naiveJsProgramOf(coreProg);
            js += '\n\nconsole.log(main());';
            return ok([ty, js]);
        });
    });
};