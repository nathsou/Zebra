"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.compileNaive = void 0;
const NaiveJSCompiler_1 = require("../Compiler/NaiveJSCompiler/NaiveJSCompiler");
const TypeCheck_1 = require("../Inferencer/TypeCheck");
const Program_1 = require("../Parser/Program");
const Result_1 = require("../Utils/Result");
const compileNaive = async (path) => {
    return Result_1.bind(await Program_1.parseProgram(path), prog => {
        return Result_1.bind(TypeCheck_1.typeCheck(prog), ({ ty, coreProg }) => {
            let js = NaiveJSCompiler_1.naiveJsProgramOf(coreProg);
            js += '\n\nconsole.log(main);';
            return Result_1.ok([ty, js]);
        });
    });
};
exports.compileNaive = compileNaive;
