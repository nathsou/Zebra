import { compileCroco } from "./Evaluator/CrocoEvaluator.ts";
import { compileNaive } from "./Evaluator/NaiveEvaluator.ts";
import { showMonoTy } from "./Inferencer/Types.ts";
import { bind, ok } from "./Utils/Result.ts";

const run = async (source: string, target = 'js'): Promise<void> => {
    const compile = target === 'js' ? compileNaive : compileCroco;

    const out = bind(compile(source), ([ty, code]) => {
        console.log(`${target === 'js' ? '//' : '--'} infered type: ${showMonoTy(ty)}`);
        return ok(code);
    }).value;

    console.log(out);
};

const [path, target] = Deno.args;

const usage = () => {
    console.info('usage: zebra src.ze js/croco');
    Deno.exit(0);
};

if (target === undefined) usage();

const source = new TextDecoder('utf-8').decode(Deno.readFileSync(path));

await run(source, target);