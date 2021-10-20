"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.showExpr = exports.varOfAux = exports.varOf = void 0;
const Context_1 = require("../Inferencer/Context");
const Pattern_1 = require("../Interpreter/Pattern");
const varOf = (name) => {
    const res = exports.varOfAux(name);
    // console.log(`varOf: ${name} : ${res.id}`);
    return res;
};
exports.varOf = varOf;
const varOfAux = (name) => ({
    type: 'variable',
    name,
    id: Context_1.nextVarId()
});
exports.varOfAux = varOfAux;
const showExpr = (expr) => {
    switch (expr.type) {
        case 'variable':
            return expr.name;
        case 'constant':
            switch (expr.kind) {
                case 'integer':
                    return `${expr.value}`;
                case 'float':
                    return `${expr.value}`;
                case 'char':
                    return `'${expr.value}'`;
            }
        case 'let_in':
            return `let ${Pattern_1.showPattern(expr.left)} = ${exports.showExpr(expr.middle)} in ${exports.showExpr(expr.right)}`;
        case 'let_rec_in':
            return `let rec ${expr.funName} ${Pattern_1.showPattern(expr.arg)} = ${exports.showExpr(expr.middle)} in ${exports.showExpr(expr.right)}`;
        case 'lambda':
            return `λ${Pattern_1.showPattern(expr.arg)} -> ${exports.showExpr(expr.body)}`;
        case 'if_then_else':
            return `if ${exports.showExpr(expr.cond)} then ${exports.showExpr(expr.thenBranch)} else ${exports.showExpr(expr.elseBranch)}`;
        case 'app':
            return `((${exports.showExpr(expr.lhs)}) ${exports.showExpr(expr.rhs)})`;
        case 'tyconst':
            if (expr.args.length === 0) {
                return expr.name;
            }
            if (expr.name === 'tuple') {
                return `(${expr.args.map(exports.showExpr).join(', ')})`;
            }
            return `(${expr.name} ${expr.args.map(a => exports.showExpr(a)).join(' ')})`;
        case 'case_of':
            const cases = expr.cases.map(({ pattern, expr }) => `${Pattern_1.showPattern(pattern)} -> ${exports.showExpr(expr)}`);
            return `case ${exports.showExpr(expr.value)} of ${cases.join('  | ')}`;
    }
};
exports.showExpr = showExpr;
