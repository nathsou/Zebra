import { inferExprType } from "./Inferencer/Inferencer.ts";
import { showMonoTy } from "./Inferencer/Types.ts";
import { interpret } from "./Interpreter/Interpreter.ts";
import { showValue } from "./Interpreter/Value.ts";
import { parse } from "./Parser/Combinators.ts";
import { expr } from "./Parser/Parser.ts";
import { bind, ok } from "./Utils/Result.ts";

const [path] = Deno.args;

const source = new TextDecoder('utf-8').decode(Deno.readFileSync(path));

console.log(bind(parse(source, expr), e => {
    return bind(inferExprType(e), ty => {
        return bind(interpret(e), res => {
            return ok(showValue(res) + ' : ' + showMonoTy(ty));
        });
    });
}).value);