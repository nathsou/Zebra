import { crocoProgramOf } from "../Compiler/CrocoCompiler/CrocoCompiler.ts";
import { declOfCore } from "../Core/CoreDecl.ts";
import { typeCheck } from "../Inferencer/TypeCheck.ts";
import { MonoTy } from "../Inferencer/Types.ts";
import { parseProgram } from "../Parser/Program.ts";
import { bind, ok, Result } from "../Utils/Result.ts";

export const compileCroco = async (path: string): Promise<Result<[ty: MonoTy, croco: string], string>> => {
    return bind(await parseProgram(path), prog => {
        return bind(typeCheck(prog), ({ coreProg, ty }) => {
            const croco = crocoProgramOf(coreProg.map(declOfCore));
            return ok([ty, croco]);
        });
    });
};