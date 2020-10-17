import { compileNaive } from "./Evaluator/NaiveEvaluator.ts";
import { showMonoTy } from "./Inferencer/Types.ts";
import { bind, ok } from "./Utils/Result.ts";

const run = async (source: string, outFile = 'a.js'): Promise<void> => {
    const out = bind(compileNaive(source), ([ty, js]) => {
        console.log(`infered type: ${showMonoTy(ty)}`);
        return ok(js);
    }).value;

    await Deno.writeFile(outFile, new TextEncoder().encode(out));
};

const [path, outFile] = Deno.args;
const source = new TextDecoder('utf-8').decode(Deno.readFileSync(path));

await run(source, outFile);