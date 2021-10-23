import { naiveJsProgramOf } from "../Compiler/NaiveJSCompiler/NaiveJSCompiler";
import { typeCheck } from "../Inferencer/TypeCheck";
import { MonoTy } from "../Inferencer/Types";
import { FileSystem } from "../Parser/FileSystem/FileSystem";
import { parseProgram } from "../Parser/Program";
import { bind, ok, Result } from "../Utils/Result";

export const compileNaive = async (path: string, fs: FileSystem): Promise<Result<readonly [ty: MonoTy, js: string], string>> => {
  return bind(await parseProgram(path, fs), prog => {
    return bind(typeCheck(prog), ({ ty, coreProg }) => {
      let js = naiveJsProgramOf(coreProg);
      js += '\n\nconsole.log(main);';
      return ok([ty, js] as const);
    });
  });
};