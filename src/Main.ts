import { CoreFuncDecl } from "./Core/CoreDecl.ts";
import { casifyFunctionDeclarations } from "./Core/Simplifier.ts";
import { collectDeclTypes, inferExprType, registerDeclTypes } from "./Inferencer/Inferencer.ts";
import { showMonoTy } from "./Inferencer/Types.ts";
import { interpret, registerDecl } from "./Interpreter/Interpreter.ts";
import { showValue } from "./Interpreter/Value.ts";
import { parse } from "./Parser/Combinators.ts";
import { program } from "./Parser/Parser.ts";
import { isNone, Maybe } from "./Utils/Mabye.ts";
import { bind, fold, ok } from "./Utils/Result.ts";

const run = (source: string): void => {
    try {
        const out = bind(parse(source, program), prog => {
            const coreProg = casifyFunctionDeclarations(prog);
            // console.log(coreProg.map(decl => showDecl(decl)).join('\n\n'));

            const main = coreProg.find(f => f.type === 'fun' && f.name === 'main') as Maybe<CoreFuncDecl>;

            if (isNone(main)) {
                throw new Error(`main function not found`);
            }

            const gamma0 = registerDeclTypes(coreProg);

            return bind(fold(coreProg, (gamma, decl) => collectDeclTypes(gamma, decl), gamma0), gamma => {
                return bind(inferExprType(main.body, gamma), ty => {
                    const env = registerDecl(coreProg);
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