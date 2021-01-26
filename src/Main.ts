import { compileCroco } from "./Evaluator/CrocoEvaluator.ts";
import { compileNaive } from "./Evaluator/NaiveEvaluator.ts";
import { typeCheck } from "./Inferencer/TypeCheck.ts";
import { showOverloadedTy } from "./Inferencer/Types.ts";
import { interpret } from "./Interpreter/Interpreter.ts";
import { showValue } from "./Interpreter/Value.ts";
import { parse } from "./Parser/Combinators.ts";
import { program } from "./Parser/Parser.ts";
import { bind, error, isOk, ok, Result } from "./Utils/Result.ts";

const run = async (source: string, target: string): Promise<void> => {

    let out: Result<string, string> = error('');

    switch (target) {
        case undefined: {
            out = bind(parse(source, program), prog => {
                // console.log(prog.map(showDecl).join('\n\n'));
                return bind(interpret(prog), ([value, _type]) => {
                    return ok(showValue(value));
                });
            });
            break;
        }

        case 'type': {
            out = bind(parse(source, program), prog => {
                return bind(typeCheck(prog), ({ ty }) => {
                    return ok(showOverloadedTy(ty));
                });
            });
            break;
        }

        case 'croco':
        case 'js': {
            const compile = target === 'js' ? compileNaive : compileCroco;
            out = bind(compile(source), ([ty, code]) => {
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

const source = new TextDecoder('utf-8').decode(Deno.readFileSync(path));

await run(source, target);