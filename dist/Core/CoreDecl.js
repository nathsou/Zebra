"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.declOfCore = exports.showCoreDecl = void 0;
const Types_1 = require("../Inferencer/Types");
const Pattern_1 = require("../Interpreter/Pattern");
const Decl_1 = require("../Parser/Decl");
const CoreExpr_1 = require("./CoreExpr");
const showCoreDecl = (decl) => {
    switch (decl.type) {
        case 'fun':
            return `${decl.funName.name} ${decl.args.map(v => v.name).join(' ')} = ${CoreExpr_1.showCoreExpr(decl.body)}`;
        case 'datatype':
            return `data ${decl.name} ${decl.typeVars.map(Types_1.showMonoTy).join(' ')} = \n` + decl.variants.map(v => '  | ' + Types_1.showMonoTy(v)).join('\n');
        case 'typeclass':
            return `class${Decl_1.showContext(decl.context)} ${decl.name} ${Types_1.showTyVar(decl.tyVar)} where\n` +
                [...decl.methods.entries()].map(([name, { ty }]) => `   ${name} : ${Types_1.showMonoTy(Types_1.canonicalizeTyVars(ty))}`).join('\n');
        case 'instance':
            return `instance${Decl_1.showContext(decl.context)} ${decl.class_} ${Types_1.showMonoTy(Types_1.canonicalizeTyVars(decl.ty))} where\n`
                + [...decl.defs.values()].map(([_, d]) => `    ${exports.showCoreDecl(d)}`).join('\n');
    }
};
exports.showCoreDecl = showCoreDecl;
const declOfCore = (d) => {
    switch (d.type) {
        case 'fun':
            return {
                type: 'fun',
                funName: d.funName,
                args: d.args.map(Pattern_1.patVarOfVar),
                body: CoreExpr_1.exprOfCore(d.body)
            };
        case 'datatype':
        case 'instance':
        case 'typeclass':
            return d;
    }
};
exports.declOfCore = declOfCore;
