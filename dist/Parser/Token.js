"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.showPosition = exports.showToken = void 0;
const tokenSymbs = {
    'dot': '.',
    'lparen': '(',
    'rparen': ')',
    'lbracket': '[',
    'rbracket': ']',
    'pipe': '|',
    'comma': ',',
    'lambda': '\\',
    'rightarrow': '->',
    'cons': '::',
    'semicolon': ';',
    'colon': ':',
    'bigarrow': '=>'
};
const showToken = (t) => {
    switch (t.type) {
        case 'identifier':
        case 'variable':
            return t.name;
        case 'comment':
            return `% ${t.value}`;
        case 'EOF':
            return 'eof';
        case 'keyword':
            return t.value;
        case 'symbol':
            return t.name;
        case 'integer':
            return t.value.toString();
        case 'char':
            return `'${t.value}'`;
        case 'float':
            return t.value.toString();
        case 'string':
            return `"${t.value}"`;
        default:
            return tokenSymbs[t.type];
    }
};
exports.showToken = showToken;
const showPosition = ({ line, column }) => {
    return `${line}:${column}`;
};
exports.showPosition = showPosition;
