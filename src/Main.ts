import { collectDeclTypes, inferExprType, registerDeclTypes } from "./Inferencer/Inferencer.ts";
import { showMonoTy, showTypeEnv } from "./Inferencer/Types.ts";
import { interpret, registerDecl } from "./Interpreter/Interpreter.ts";
import { showValue } from "./Interpreter/Value.ts";
import { parse } from "./Parser/Combinators.ts";
import { FuncDecl } from "./Parser/Decl.ts";
import { program } from "./Parser/Parser.ts";
import { isNone, Maybe } from "./Utils/Mabye.ts";
import { bind, fold, ok } from "./Utils/Result.ts";

const run = (source: string): void => {
    try {
        const out = bind(parse(source, program), prog => {
            const main = prog.find(f => f.type === 'fun' && f.name === 'main') as Maybe<FuncDecl>;

            if (isNone(main)) {
                throw new Error(`main function not found`);
            }

            // console.log(prog.map(decl => showDecl(decl)).join('\n\n'));

            const gamma0 = registerDeclTypes(prog);

            return bind(fold(prog, (gamma, decl) => collectDeclTypes(gamma, decl), gamma0), gamma => {
                // console.log(showTypeEnv(gamma));
                return bind(inferExprType(main.body, gamma), ty => {
                    const env = registerDecl(prog);
                    return bind(interpret(main.body, env), res => {
                        return ok(showValue(res) + ' : ' + showMonoTy(ty));
                    });
                });
            });
        }).value;

        console.log(out);
    } catch (e) {
        console.error(e);
    }
};

const [path] = Deno.args;
const source = new TextDecoder('utf-8').decode(Deno.readFileSync(path));

run(source);