import { crocoProgramOf } from "../Compiler/CrocoCompiler/CrocoCompiler.ts";
import { typeCheck } from "../Inferencer/TypeCheck.ts";
import { MonoTy } from "../Inferencer/Types.ts";
import { parse } from "../Parser/Combinators.ts";
import { program } from "../Parser/Parser.ts";
import { bind, ok, Result } from "../Utils/Result.ts";

export const compileCroco = (source: string): Result<[ty: MonoTy, croco: string], string> => {
    return bind(parse(source, program), prog => {
        return bind(typeCheck(prog), ({ ty }) => {
            const croco = crocoProgramOf(prog);
            return ok([ty, croco]);
        });
    });
};