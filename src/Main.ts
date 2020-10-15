import { CoreFuncDecl } from "./Core/CoreDecl.ts";
import { casifyFunctionDeclarations } from "./Core/Simplifier.ts";
import { inferExprType, registerDeclTypes } from "./Inferencer/Inferencer.ts";
import { canonicalizeTyVars, showMonoTy } from "./Inferencer/Types.ts";
import { interpret, registerDecl } from "./Interpreter/Interpreter.ts";
import { showValue } from "./Interpreter/Value.ts";
import { parse } from "./Parser/Combinators.ts";
import { program } from "./Parser/Parser.ts";
import { isNone, Maybe } from "./Utils/Mabye.ts";
import { bind, ok } from "./Utils/Result.ts";

const run = (source: string): void => {
    try {
        const out = bind(parse(source, program), prog => {
            const coreProg = casifyFunctionDeclarations(prog);
            // console.log(coreProg.map(decl => showDecl(decl)).join('\n\n'));
            // console.log(coreProg.map(primitiveDeclOfCoreDecl).map(showPrimDecl).join('\n\n'));

            const main = coreProg.find(f => f.type === 'fun' && f.name === 'main') as Maybe<CoreFuncDecl>;

            if (isNone(main)) {
                throw new Error(`main function not found`);
            }

            return bind(registerDeclTypes(coreProg), gamma => {
                return bind(inferExprType(main.body, gamma), ty => {
                    const env = registerDecl(coreProg);
                    return bind(interpret(main.body, env), res => {
                        const niceTy = canonicalizeTyVars(ty);
                        return ok(showValue(res) + ' : ' + showMonoTy(niceTy));
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