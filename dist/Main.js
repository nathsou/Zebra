"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const PrimitiveCompiler_1 = require("./Compiler/Primitive/PrimitiveCompiler");
const PrimitiveDecl_1 = require("./Compiler/Primitive/PrimitiveDecl");
const CoreDecl_1 = require("./Core/CoreDecl");
const CrocoEvaluator_1 = require("./Evaluator/CrocoEvaluator");
const NaiveEvaluator_1 = require("./Evaluator/NaiveEvaluator");
const TypeCheck_1 = require("./Inferencer/TypeCheck");
const Types_1 = require("./Inferencer/Types");
const Interpreter_1 = require("./Interpreter/Interpreter");
const Value_1 = require("./Interpreter/Value");
const Program_1 = require("./Parser/Program");
const Result_1 = require("./Utils/Result");
const run = async (path, target) => {
    let out = Result_1.error('');
    switch (target) {
        case undefined: {
            out = Result_1.bind(await Program_1.parseProgram(path), prog => {
                return Result_1.bind(Interpreter_1.interpret(prog), ([value, _type]) => {
                    return Result_1.ok(Value_1.showValue(value));
                });
            });
            break;
        }
        case 'type': {
            out = Result_1.bind(await Program_1.parseProgram(path), prog => {
                return Result_1.bind(TypeCheck_1.typeCheck(prog), ({ ty }) => {
                    return Result_1.ok(Types_1.showOverloadedTy(ty));
                });
            });
            break;
        }
        case 'core':
            out = Result_1.bind(await Program_1.parseProgram(path), prog => {
                return Result_1.bind(TypeCheck_1.typeCheck(prog), ({ coreProg }) => {
                    return Result_1.ok(coreProg.map(CoreDecl_1.showCoreDecl).join('\n\n'));
                });
            });
            break;
        case 'prim':
            out = Result_1.bind(await Program_1.parseProgram(path), prog => {
                return Result_1.bind(TypeCheck_1.typeCheck(prog), ({ coreProg }) => {
                    return Result_1.ok(PrimitiveCompiler_1.primitiveProgramOfCore(coreProg)
                        .map(PrimitiveDecl_1.showPrimDecl)
                        .join('\n\n'));
                });
            });
            break;
        case 'croco':
        case 'js': {
            const compile = target === 'js' ? NaiveEvaluator_1.compileNaive : CrocoEvaluator_1.compileCroco;
            out = Result_1.bind(await compile(path), ([ty, code]) => {
                console.log(`${target === 'js' ? '//' : '--'} infered type: ${Types_1.showOverloadedTy(ty)}`);
                return Result_1.ok(code);
            });
            break;
        }
        default: {
            console.error(`invalid target: '${target}'`);
            usage();
        }
    }
    const log = Result_1.isOk(out) ? console.log : console.error;
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
