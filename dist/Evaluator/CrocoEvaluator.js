"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.compileCroco = void 0;
const CrocoCompiler_1 = require("../Compiler/CrocoCompiler/CrocoCompiler");
const CoreDecl_1 = require("../Core/CoreDecl");
const TypeCheck_1 = require("../Inferencer/TypeCheck");
const Program_1 = require("../Parser/Program");
const Result_1 = require("../Utils/Result");
const compileCroco = async (path) => {
    return Result_1.bind(await Program_1.parseProgram(path), prog => {
        return Result_1.bind(TypeCheck_1.typeCheck(prog), ({ coreProg, ty }) => {
            const croco = CrocoCompiler_1.crocoProgramOf(coreProg.map(CoreDecl_1.declOfCore));
            return Result_1.ok([ty, croco]);
        });
    });
};
exports.compileCroco = compileCroco;
