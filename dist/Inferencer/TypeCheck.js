"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.typeCheck = void 0;
const ExprOfFunDecls_1 = require("../Core/ExprOfFunDecls");
const Expr_1 = require("../Parser/Expr");
const Common_1 = require("../Utils/Common");
const Maybe_1 = require("../Utils/Maybe");
const Result_1 = require("../Utils/Result");
const Context_1 = require("./Context");
const Inferencer_1 = require("./Inferencer");
const Monomorphize_1 = require("./Monomorphize");
const Primitives_1 = require("./Primitives");
const Types_1 = require("./Types");
const Unification_1 = require("./Unification");
const wrapMain = (main, name) => {
    return {
        type: 'let_in',
        left: name,
        middle: main,
        right: Expr_1.varOf('main')
    };
};
const reorderFuncs = (funcs, order) => {
    const funcsByName = new Map(funcs.map(d => [d.funName.name, d]));
    const reordered = order
        .filter(f => funcsByName.has(f))
        .map(f => Common_1.defined(funcsByName.get(f)));
    return reordered;
};
const typeCheck = (prog) => {
    const main = prog.getCoreFuncDecl('main');
    if (Maybe_1.isNone(main)) {
        return Result_1.error(`main function not found`);
    }
    const singleExprProg = ExprOfFunDecls_1.singleExprProgOf(prog, true);
    // clear the global context
    Context_1.clearContext();
    // initialize the context
    Inferencer_1.registerTypeDecls(prog);
    const gamma = Primitives_1.primitiveEnv();
    return Result_1.bind(Inferencer_1.inferExprType(wrapMain(singleExprProg, main.funName), gamma), ([ty, sig1]) => {
        return Result_1.bind(Inferencer_1.typeCheckInstances(prog.instances), sig2 => {
            return Result_1.bind(Unification_1.substCompose(sig1, sig2), sig12 => {
                // console.log(
                //     [...context.identifiers.entries()]
                //         // .filter(([k, [f, ty]]) => showPolyTy(okOrThrow(substitutePoly(ty, sig12))).includes('μ14'))
                //         .filter(([k, [f, ty]]) => f.includes('boolBinOp'))
                //         // .map(([k, [f, ty]]) => `${f} ${k}: ${showPolyTy(ty)}`)
                //         .map(([k, [f, ty]]) => `${f} ${k}: ${showPolyTy(okOrThrow(substitutePoly(ty, sig1)))}`)
                //         .join('\n')
                // );
                return Result_1.bind(Monomorphize_1.monomorphizeProg(prog, sig12), mono => {
                    const deps = ExprOfFunDecls_1.funcDeclsDependencies(mono, prog.datatypes.values());
                    const reorderd = reorderFuncs(mono, [...ExprOfFunDecls_1.usedFuncDecls('main', deps)].reverse());
                    return Result_1.ok({
                        ty: Types_1.canonicalizeTyVars(ty),
                        main: Common_1.defined(Common_1.find(mono, f => f.funName.name === 'main')),
                        coreProg: [...prog.datatypes.values(), ...reorderd],
                        singleExprProg,
                        sig: sig12
                    });
                });
            });
        });
    });
};
exports.typeCheck = typeCheck;
