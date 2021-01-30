import { primitiveProgramOfCore } from "./Compiler/Primitive/PrimitiveCompiler.ts";
import { showPrimDecl } from "./Compiler/Primitive/PrimitiveDecl.ts";
import { showCoreDecl } from "./Core/CoreDecl.ts";
import { compileCroco } from "./Evaluator/CrocoEvaluator.ts";
import { compileNaive } from "./Evaluator/NaiveEvaluator.ts";
import { typeCheck } from "./Inferencer/TypeCheck.ts";
import { showOverloadedTy } from "./Inferencer/Types.ts";
import { interpret } from "./Interpreter/Interpreter.ts";
import { showValue } from "./Interpreter/Value.ts";
import { parseProgram } from "./Parser/Program.ts";
import { bind, error, isOk, ok, Result } from "./Utils/Result.ts";

const run = async (path: string, target: string): Promise<void> => {

    let out: Result<string, string> = error('');

    switch (target) {
        case undefined: {
            out = bind(await parseProgram(path), prog => {
                return bind(interpret(prog), ([value, _type]) => {
                    return ok(showValue(value));
                });
            });
            break;
        }

        case 'type': {
            out = bind(await parseProgram(path), prog => {
                return bind(typeCheck(prog), ({ ty }) => {
                    return ok(showOverloadedTy(ty));
                });
            });
            break;
        }

        case 'core':
            out = bind(await parseProgram(path), prog => {
                return bind(typeCheck(prog), ({ coreProg }) => {
                    return ok(coreProg.map(showCoreDecl).join('\n\n'));
                });
            });
            break;

        case 'prim':
            out = bind(await parseProgram(path), prog => {
                return bind(typeCheck(prog), ({ coreProg }) => {
                    return ok(
                        primitiveProgramOfCore(coreProg)
                            .map(showPrimDecl)
                            .join('\n\n')
                    );
                });
            });
            break;

        case 'croco':
        case 'js': {
            const compile = target === 'js' ? compileNaive : compileCroco;
            out = bind(await compile(path), ([ty, code]) => {
                console.log(`${target === 'js' ? '//' : '--'} infered type: ${showOverloadedTy(ty)}`);
                return ok(code);
            });
            break;
        }

        default: {
            console.error(`invalid target: '${target}'`);
            usage();
        }
    }

    const log = isOk(out) ? console.log : console.error;

    log(out.value);
};

const [path, target] = Deno.args;

const usage = () => {
    console.info('usage: zebra src.ze [js/croco]');
    Deno.exit(0);
};

if (path === undefined) usage();

await run(path, target);