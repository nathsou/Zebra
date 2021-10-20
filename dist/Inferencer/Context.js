"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearContext = exports.context = exports.nextTyVarId = exports.nextVarId = void 0;
const nextVarId = () => exports.context.varId++;
exports.nextVarId = nextVarId;
const nextTyVarId = () => exports.context.tyVarId++;
exports.nextTyVarId = nextTyVarId;
// global context
exports.context = {
    varId: 0,
    tyVarId: 0,
    instances: new Map(),
    datatypes: new Map(),
    typeclasses: new Map(),
    typeClassMethods: new Map(),
    typeClassMethodsOccs: new Map(),
    identifiers: new Map()
};
const clearContext = () => {
    exports.context.varId = 0;
    exports.context.tyVarId = 0;
    exports.context.instances.clear();
    exports.context.datatypes.clear();
    exports.context.typeclasses.clear();
    exports.context.typeClassMethods.clear();
    exports.context.typeClassMethodsOccs.clear();
    exports.context.identifiers.clear();
};
exports.clearContext = clearContext;
