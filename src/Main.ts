import { primitiveProgramOfCore } from "./Compiler/Primitive/PrimitiveCompiler";
import { showPrimDecl } from "./Compiler/Primitive/PrimitiveDecl";
import { showCoreDecl } from "./Core/CoreDecl";
import { compileCroco } from "./Evaluator/CrocoEvaluator";
import { compileNaive } from "./Evaluator/NaiveEvaluator";
import { typeCheck } from "./Inferencer/TypeCheck";
import { showOverloadedTy } from "./Inferencer/Types";
import { interpret } from "./Interpreter/Interpreter";
import { showValue } from "./Interpreter/Value";
import { parseProgram } from "./Parser/Program";
import { bind, error, isOk, ok, Result } from "./Utils/Result";

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

const [, , path, target] = process.argv;

const usage = () => {
    console.info('usage: zebra src.ze [js/croco]');
    process.exit(0);
};

if (path === undefined) {
    usage();
}

(async () => {
    await run(path, target);
})();