import { naiveJsProgramOf } from "../Compiler/NaiveJSCompiler/NaiveJSCompiler";
import { typeCheck } from "../Inferencer/TypeCheck";
import { MonoTy } from "../Inferencer/Types";
import { parseProgram } from "../Parser/Program";
import { bind, ok, Result } from "../Utils/Result";

export const compileNaive = async (path: string): Promise<Result<[ty: MonoTy, js: string], string>> => {
  return bind(await parseProgram(path), prog => {
    return bind(typeCheck(prog), ({ ty, coreProg }) => {
      let js = naiveJsProgramOf(coreProg);
      js += '\n\nconsole.log(main);';
      return ok([ty, js]);
    });
  });
};