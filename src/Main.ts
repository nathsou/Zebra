import { collectDeclTypes, inferExprType } from "./Inferencer/Inferencer.ts";
import { PolyTy, showMonoTy } from "./Inferencer/Types.ts";
import { interpret, registerDecl } from "./Interpreter/Interpreter.ts";
import { showValue, Value } from "./Interpreter/Value.ts";
import { parse } from "./Parser/Combinators.ts";
import { program } from "./Parser/Parser.ts";
import { emptyEnv } from "./Utils/Env.ts";
import { isNone } from "./Utils/Mabye.ts";
import { bind, fold, ok } from "./Utils/Result.ts";

const [path] = Deno.args;

const source = new TextDecoder('utf-8').decode(Deno.readFileSync(path));

console.log(bind(parse(source, program), prog => {
    const main = prog.filter(decl => decl.type === 'fun').find(f => f.name === 'main');

    if (isNone(main)) {
        throw new Error(`main function not found`);
    }

    return bind(fold(prog, (gamma, decl) => collectDeclTypes(gamma, decl), emptyEnv<PolyTy>()), gamma => {
        return bind(fold(prog, (env, decl) => registerDecl(decl, env), emptyEnv<Value>()), env => {
            return bind(inferExprType(main.body, gamma), ty => {
                return bind(interpret(main.body, env), res => {
                    return ok(showValue(res) + ' : ' + showMonoTy(ty));
                });
            });
        });
    });
}).value);