"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.showPrimDecl = void 0;
const PrimitiveCompiler_1 = require("./PrimitiveCompiler");
const showPrimDecl = (d) => {
    switch (d.type) {
        case 'fun':
            return `${d.name} ${d.args.join(' ')} = ${PrimitiveCompiler_1.showPrim(d.body)}`;
    }
};
exports.showPrimDecl = showPrimDecl;
