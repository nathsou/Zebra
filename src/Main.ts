import { compileCroco } from "./Evaluator/CrocoEvaluator.ts";
import { compileNaive } from "./Evaluator/NaiveEvaluator.ts";
import { showMonoTy } from "./Inferencer/Types.ts";
import { interpret } from "./Interpreter/Interpreter.ts";
import { showValue } from "./Interpreter/Value.ts";
import { parse } from "./Parser/Combinators.ts";
import { program } from "./Parser/Parser.ts";
import { bind, ok } from "./Utils/Result.ts";

const run = async (source: string, target: string): Promise<void> => {
    if (target === undefined) {
        const out = bind(parse(source, program), prog => {
            return bind(interpret(prog), ([value, _type]) => {
                return ok(showValue(value));
            });
        }).value;

        

        console.log(out);
    } else {
        const compile = target === 'js' ? compileNaive : compileCroco;
        const out = bind(compile(source), ([ty, code]) => {
            console.log(`${target === 'js' ? '//' : '--'} infered type: ${showMonoTy(ty)}`);
            return ok(code);
        }).value;

        console.log(out);
    }
};

const [path, target] = Deno.args;

const usage = () => {
    console.info('usage: zebra src.ze [js/croco]');
    Deno.exit(0);
};

if (path === undefined) usage();

const source = new TextDecoder('utf-8').decode(Deno.readFileSync(path));

await run(source, target);