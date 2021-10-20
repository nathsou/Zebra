"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parse = exports.optional = exports.using = exports.cache = exports.rightassoc = exports.leftassoc = exports.fold = exports.oneOf = exports.sepBy = exports.commas = exports.brackets = exports.maybeParens = exports.parens = exports.symbol = exports.keyword = exports.token = exports.formatToken = exports.some = exports.many = exports.map = exports.alt = exports.seq = exports.current = exports.advance = void 0;
const Maybe_1 = require("../Utils/Maybe");
const Result_1 = require("../Utils/Result");
const Lexer_1 = require("./Lexer");
const Token_1 = require("./Token");
const advance = (state) => {
    state.pos++;
};
exports.advance = advance;
const current = ({ tokens, pos }) => {
    return tokens[pos];
};
exports.current = current;
const parserOf = (p) => {
    if (typeof p === 'object')
        return p.ref;
    return p;
};
function seq(...parsers) {
    return state => {
        const vals = [];
        for (const p of parsers) {
            const res = parserOf(p)(state);
            if (Result_1.isError(res))
                return res;
            vals.push(res.value);
        }
        return Result_1.ok(vals);
    };
}
exports.seq = seq;
// right lazy alternative
const alt = (...ps) => state => {
    const { pos } = state;
    let res = Result_1.error('`alt` received an empty list of parsers');
    for (const p of ps) {
        state.pos = pos;
        res = parserOf(p)(state);
        if (Result_1.isOk(res)) {
            return res;
        }
    }
    return res;
};
exports.alt = alt;
const map = (p, f) => {
    return state => Result_1.bind(p(state), v => Result_1.ok(f(v)));
};
exports.map = map;
/**
 * applies p at least once
 */
const many = (p) => state => {
    const values = [];
    let res = parserOf(p)(state);
    while (Result_1.isOk(res)) {
        values.push(res.value);
        res = parserOf(p)(state);
    }
    return Result_1.ok(values);
};
exports.many = many;
/**
 * applies p zero or more times
 */
const some = (p) => state => {
    const values = [];
    let res;
    while (true) {
        res = parserOf(p)(state);
        if (Result_1.isError(res))
            break;
        values.push(res.value);
    }
    return Result_1.ok(values);
};
exports.some = some;
/**
 * formats a token for debugging
 * @param t the token to format
 */
const formatToken = (t) => {
    if (Maybe_1.isSome(t)) {
        return `'${Token_1.showToken(t)}' at ${Token_1.showPosition(t)}`;
    }
    return 'invalid token';
};
exports.formatToken = formatToken;
/**
 * parses a single token of the specified type
 * @param type the type of token to be parsed
 */
const token = (type) => {
    return state => {
        const tok = exports.current(state);
        if (tok?.type === type) {
            exports.advance(state);
            return Result_1.ok(tok);
        }
        return Result_1.error(`expected token of type "${type}"`);
    };
};
exports.token = token;
/**
 * parses a single keyword
 * @param value the type of keyword
 */
const keyword = (value) => {
    return state => {
        const tok = exports.current(state);
        if (tok?.type === 'keyword' && tok.value === value) {
            exports.advance(state);
            return Result_1.ok(tok);
        }
        return Result_1.error(`expected token of type "${value}"`);
    };
};
exports.keyword = keyword;
/**
 * parses a single symbol
 * @param value the type of keyword
 */
const symbol = (name) => {
    return state => {
        const tok = exports.current(state);
        if (tok?.type === 'symbol' && tok.name === name) {
            exports.advance(state);
            return Result_1.ok(tok);
        }
        return Result_1.error(`expected symbol : "${name}"`);
    };
};
exports.symbol = symbol;
/**
 * parses a value surrounded by parentheses
 * @param p the parser matching the value between the parentheses
 */
const parens = (p) => {
    return exports.map(seq(exports.token('lparen'), p, exports.token('rparen')), ([_l, res, _r]) => res);
};
exports.parens = parens;
const maybeParens = (p) => {
    return exports.alt(p, exports.parens(p));
};
exports.maybeParens = maybeParens;
/**
 * parses a value surrounded by square brackets
 * @param p the parser matching the value between the square brackets
 */
const brackets = (p) => {
    return exports.map(seq(exports.token('lbracket'), p, exports.token('rbracket')), ([_l, res, _r]) => res);
};
exports.brackets = brackets;
/**
 * parses a list of values separated by commas
 * @param p the parser matching comma separated values
 */
const commas = (p) => exports.sepBy(p, 'comma');
exports.commas = commas;
/**
 * parses a list of values separated by the given token type
 * @param p the parser matching separated values
 */
const sepBy = (p, separator, acceptTrailing = false) => {
    return state => {
        const values = [];
        let first = true;
        do {
            if (!first) {
                exports.advance(state);
            }
            else {
                first = false;
            }
            const res = parserOf(p)(state);
            if (Result_1.isError(res)) {
                if (acceptTrailing && values.length > 0) {
                    return Result_1.ok(values);
                }
                else {
                    return res;
                }
            }
            else {
                values.push(res.value);
            }
        } while (exports.current(state)?.type === separator);
        return Result_1.ok(values);
    };
};
exports.sepBy = sepBy;
function oneOf(...ps) {
    return exports.alt(...ps);
}
exports.oneOf = oneOf;
const fold = (p, f) => exports.map(p, res => res.reduce(f));
exports.fold = fold;
const leftassoc = (l, r, f) => {
    return exports.map(seq(l, exports.many(r)), ([h, tl]) => tl.length === 0 ? h : tl.reduce(f, h));
};
exports.leftassoc = leftassoc;
const rightassoc = (l, r, f) => {
    return exports.map(seq(exports.some(l), r), ([tl, h]) => tl.length === 0 ? h : tl.reduce(f, h));
};
exports.rightassoc = rightassoc;
const cache = (p) => {
    let cachedRes = null;
    return (state) => {
        if (cachedRes === null) {
            cachedRes = parserOf(p)(state);
        }
        return cachedRes;
    };
};
exports.cache = cache;
const using = (f, x) => {
    return f(x());
};
exports.using = using;
const optional = (p) => state => {
    const res = parserOf(p)(state);
    if (Result_1.isError(res))
        return Result_1.ok(Maybe_1.None);
    return Result_1.ok(res.value);
};
exports.optional = optional;
/**
 * utility function to parse an input string with the given parser
 * it handles the tokenization and the creation of an internal state
 * and attempts to process the entire input
 * @param input the string to parse
 * @param parser the parser to use
 */
const parse = (input, parser) => {
    return Result_1.bind(Result_1.mapResult([...Lexer_1.lex(input)], x => x), tokens => {
        const state = { tokens, pos: 0 };
        const res = parserOf(parser)(state);
        if (state.pos !== state.tokens.length) {
            return Result_1.error(`Unexpected token: ${exports.formatToken(state.tokens[state.pos])}`);
        }
        return res;
    });
};
exports.parse = parse;
