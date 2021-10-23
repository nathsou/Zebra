import { crocoProgramOf } from "../Compiler/CrocoCompiler/CrocoCompiler";
import { declOfCore } from "../Core/CoreDecl";
import { typeCheck } from "../Inferencer/TypeCheck";
import { MonoTy } from "../Inferencer/Types";
import { FileSystem } from "../Parser/FileSystem/FileSystem";
import { parseProgram } from "../Parser/Program";
import { bind, ok, Result } from "../Utils/Result";

export const compileCroco = async (path: string, fs: FileSystem): Promise<Result<readonly [ty: MonoTy, croco: string], string>> => {
  return bind(await parseProgram(path, fs), prog => {
    return bind(typeCheck(prog), ({ coreProg, ty }) => {
      const croco = crocoProgramOf(coreProg.map(declOfCore));
      return ok([ty, croco] as const);
    });
  });
};