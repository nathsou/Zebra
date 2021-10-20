"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.symbolRenameMap = void 0;
const Common_1 = require("../Utils/Common");
const symbolRenameMapObj = {
    '.': 'dot',
    '-': 'minus',
    '~': 'tilde',
    '+': 'plus',
    '*': 'star',
    '&': 'ampersand',
    '|': 'pipe',
    '/': 'slash',
    '\\': 'backslash',
    '^': 'caret',
    '%': 'percent',
    '°': 'num',
    '$': 'dollar',
    '@': 'at',
    '#': 'hash',
    ';': 'semicolon',
    ':': 'colon',
    '_': 'underscore',
    '=': 'eq',
    "'": 'prime',
    '>': 'gtr',
    '<': 'lss',
    '!': 'exclamation'
};
exports.symbolRenameMap = Common_1.mapOf(symbolRenameMapObj);
