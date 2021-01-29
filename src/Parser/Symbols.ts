import { mapOf } from "../Utils/Common.ts";

export type Symbols = keyof (typeof symbolRenameMapObj);

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

export const symbolRenameMap = mapOf(symbolRenameMapObj);