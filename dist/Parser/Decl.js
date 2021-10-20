"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.showDecl = exports.showContext = void 0;
const CoreDecl_1 = require("../Core/CoreDecl");
const Types_1 = require("../Inferencer/Types");
const Pattern_1 = require("../Interpreter/Pattern");
// Declarations are expressions affecting the global environment
const Expr_1 = require("./Expr");
const showContext = (ctx) => {
    if (ctx.length === 0)
        return '';
    return ` (${ctx.map(c => `${c.name} ${c.tyVars.map(Types_1.showTyVar).join(' ')}`).join(', ')}) => `;
};
exports.showContext = showContext;
const showDecl = (decl) => {
    switch (decl.type) {
        case 'fun':
            return `${decl.funName} ${decl.args.map(Pattern_1.showPattern).join(' ')} = ${Expr_1.showExpr(decl.body)}`;
        case 'datatype':
            return `data ${decl.name} ${decl.typeVars.map(Types_1.showMonoTy).join(' ')} = \n` + decl.variants.map(v => '  | ' + Types_1.showMonoTy(v)).join('\n');
        case 'typeclass':
            return `class${exports.showContext(decl.context)} ${decl.name} ${Types_1.showTyVar(decl.tyVar)} where\n` +
                [...decl.methods.entries()].map(([name, { ty }]) => `   ${name} : ${Types_1.showMonoTy(Types_1.canonicalizeTyVars(ty))}`).join('\n');
        case 'instance':
            return `instance${exports.showContext(decl.context)} ${decl.class_} ${Types_1.showMonoTy(Types_1.canonicalizeTyVars(decl.ty))} where\n`
                + [...decl.defs.values()].map(([_, d]) => `    ${CoreDecl_1.showCoreDecl(d)}`).join('\n');
        case 'import':
            return `import "${decl.path}" (${decl.imports.join(', ')})`;
        case 'export':
            return `export (${decl.exports.join(', ')})`;
    }
};
exports.showDecl = showDecl;
