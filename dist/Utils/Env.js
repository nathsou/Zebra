"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.envMapRes = exports.envMap = exports.envSum = exports.envRem = exports.envAddMut = exports.envAdd = exports.envGet = exports.envHas = exports.emptyEnv = void 0;
const Result_1 = require("./Result");
const emptyEnv = () => ({});
exports.emptyEnv = emptyEnv;
const envHas = (env, x) => env[x] !== undefined;
exports.envHas = envHas;
const envGet = (env, x) => env[x];
exports.envGet = envGet;
const envAdd = (env, x, val) => ({ ...env, [x]: val });
exports.envAdd = envAdd;
const envAddMut = (env, x, val) => {
    env[x] = val;
    return env;
};
exports.envAddMut = envAddMut;
const envRem = (env, x) => {
    const cpy = { ...env };
    delete cpy[x];
    return cpy;
};
exports.envRem = envRem;
const envSum = (env1, env2) => ({ ...env1, ...env2 });
exports.envSum = envSum;
const envMap = (env, f) => {
    const env2 = {};
    for (const [x, t] of Object.entries(env)) {
        env2[x] = f(t);
    }
    return env2;
};
exports.envMap = envMap;
const envMapRes = (env, f) => {
    const env2 = {};
    for (const [x, t] of Object.entries(env)) {
        const res = f(t);
        if (Result_1.isError(res))
            return res;
        env2[x] = res.value;
    }
    return Result_1.ok(env2);
};
exports.envMapRes = envMapRes;
