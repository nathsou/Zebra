import { isSome, Maybe } from "../Utils/Mabye.ts";
import { bind, error, isError, isOk, mapResult, ok, Result } from "../Utils/Result.ts";
import { lex, LexerError } from "./Lexer.ts";
import { showPosition, showToken, Token, TokenType, Tok, KeywordType } from "./Token.ts";

/**
 * type returned when parsing is unsuccessful
 */
export type ParserError = string;
export type ParserResult<T> = Result<T, ParserError>;

/**
 * A parser is a function attempting to match a pattern in
 * the tokens given as input
 * 
 * parsers are not pure functions, the state's current token
 * position is mutated
 * @param T the type returned when parsing is successfull
 */
export type Parser<T> = (state: ParserState) => ParserResult<T>;

type LazyParser<T> = () => Parser<T>;
type AnyParser<T> = Parser<T> | LazyParser<T>;

function isLazy<T>(p: AnyParser<T>): p is LazyParser<T> {
    // parsers receive one argument (the state)
    // lazy parsers receive no arguments
    return p.length === 0;
}

/**
 * the state used by parsers
 * it consists of an immutable array of tokens
 * along with a mutable index indicating
 * the current position into that array
 */
export interface ParserState {
    readonly tokens: Token[];
    pos: number;
}

export const advance = (state: ParserState): void => {
    state.pos++;
};

export const current = ({ tokens, pos }: ParserState): Maybe<Token> => {
    return tokens[pos];
};

// could variatic tuple types help here?
export function seq<A>(a: AnyParser<A>): Parser<[A]>;
export function seq<A, B>(a: AnyParser<A>, b: AnyParser<B>): Parser<[A, B]>;
export function seq<A, B, C>(a: AnyParser<A>, b: AnyParser<B>, c: AnyParser<C>): Parser<[A, B, C]>;
export function seq<A, B, C, D>(a: AnyParser<A>, b: AnyParser<B>, c: AnyParser<C>, d: AnyParser<D>): Parser<[A, B, C, D]>;
export function seq<A, B, C, D, E>(a: AnyParser<A>, b: AnyParser<B>, c: AnyParser<C>, d: AnyParser<D>, e: AnyParser<E>): Parser<[A, B, C, D, E]>;
export function seq<A, B, C, D, E, F>(a: AnyParser<A>, b: AnyParser<B>, c: AnyParser<C>, d: AnyParser<D>, e: AnyParser<E>, f: AnyParser<F>): Parser<[A, B, C, D, E, F]>;
export function seq<A, B, C, D, E, F, G>(a: AnyParser<A>, b: AnyParser<B>, c: AnyParser<C>, d: AnyParser<D>, e: AnyParser<E>, f: AnyParser<F>, g: AnyParser<G>): Parser<[A, B, C, D, E, F, G]>;
export function seq<A, B, C, D, E, F, G, H>(a: AnyParser<A>, b: AnyParser<B>, c: AnyParser<C>, d: AnyParser<D>, e: AnyParser<E>, f: AnyParser<F>, g: AnyParser<G>, h: AnyParser<H>): Parser<[A, B, C, D, E, F, G, H]>;
export function seq(...parsers: AnyParser<any>[]): Parser<any[]> {
    return state => {
        const vals: any[] = [];

        for (const p of parsers) {
            const res = parserOf(p)(state);
            if (isError(res)) return res;
            vals.push(res.value);
        }

        return ok(vals);
    };
}

const parserOf = <T>(p: AnyParser<T>): Parser<T> => isLazy(p) ? p() : p;

// right lazy alternative
export const alt = <T>(...ps: AnyParser<T>[]): Parser<T> => state => {
    const { pos } = state;
    let res: ParserResult<T> = error('`alt` received an empty list of parsers');

    for (const p of ps) {
        state.pos = pos;
        res = parserOf(p)(state);
        if (isOk(res)) {
            return res;
        }
    }

    return res;
};

export const map = <A, B>(p: Parser<A>, f: (v: A) => B): Parser<B> => {
    return state => bind(p(state), v => ok(f(v)));
};

export const many = <T>(p: Parser<T>): Parser<T[]> => state => {
    const values: T[] = [];

    let res = p(state);

    while (isOk(res)) {
        values.push(res.value);
        res = p(state);
    }

    return ok(values);
};

/**
 * formats a token for debugging
 * @param t the token to format
 */
export const formatToken = (t: Maybe<Token>): string => {
    if (isSome(t)) {
        return `'${showToken(t)}' at ${showPosition(t)}`;
    }

    return 'invalid token';
};

/**
 * parses a single token of the specified type
 * @param type the type of token to be parsed
 */
export const token = <T extends TokenType>(type: T): Parser<Tok<T> & Token> => {
    return state => {
        const tok = current(state);
        if (tok?.type === type) {
            advance(state);
            return ok(tok as Tok<T> & Token);
        }

        return error(`expected token of type "${type}"`);
    };
};

/**
 * parses a single keyword
 * @param value the type of keyword
 */
export const keyword = <V extends KeywordType>(value: V): Parser<Tok<'keyword', { value: V }>> => {
    return state => {
        const tok = current(state);
        if (tok?.type === 'keyword' && tok.value === value) {
            advance(state);
            return ok(tok as Tok<'keyword', { value: V }>);
        }

        return error(`expected token of type "${value}"`);
    };
};

/**
 * parses a single symbol
 * @param value the type of keyword
 */
export const symbol = <V extends string>(name: V): Parser<Tok<'symbol', { name: V }>> => {
    return state => {
        const tok = current(state);
        if (tok?.type === 'symbol' && tok.name === name) {
            advance(state);
            return ok(tok as Tok<'symbol', { name: V }>);
        }

        return error(`expected symbol : "${name}"`);
    };
};

/**
 * parses a value surrounded by parentheses
 * @param p the parser matching the value between the parentheses
 */
export const parens = <T>(p: AnyParser<T>): Parser<T> => {
    return map(seq(token('lparen'), seq(p, token('rparen'))), ([_l, [res, _r]]) => res);
};

/**
 * parses a value surrounded by square brackets
 * @param p the parser matching the value between the square brackets
 */
export const brackets = <T>(p: AnyParser<T>): Parser<T> => {
    return map(seq(token('lbracket'), seq(p, token('rbracket'))), ([_l, [res, _r]]) => res);
};

/**
 * parses a list of values separated by commas
 * @param p the parser matching comma separated values
 */
export const commas = <T>(p: AnyParser<T>) => sepBy(p, 'comma');

/**
 * parses a list of values separated by the given token type
 * @param p the parser matching separated values
 */
export const sepBy = <T>(p: AnyParser<T>, separator: TokenType): Parser<T[]> => {
    return state => {
        const values: T[] = [];
        let first = true;

        do {
            if (!first) {
                advance(state);
            } else {
                first = false;
            }

            const res = parserOf(p)(state);
            if (isError(res)) {
                return res;
            } else {
                values.push(res.value);
            }
        } while (current(state)?.type === separator);

        return ok(values);
    };
};

export function oneOf<A>(a: Parser<A>): Parser<A>;
export function oneOf<A, B>(a: Parser<A>, b: Parser<B>): Parser<A | B>;
export function oneOf<A, B, C>(a: Parser<A>, b: Parser<B>, c: Parser<C>): Parser<A | B | C>;
export function oneOf<A, B, C, D>(a: Parser<A>, b: Parser<B>, c: Parser<C>, d: Parser<D>): Parser<A | B | C | D>;
export function oneOf<A, B, C, D, E>(a: Parser<A>, b: Parser<B>, c: Parser<C>, d: Parser<D>, e: Parser<E>): Parser<A | B | C | D | E>;
export function oneOf<A, B, C, D, E, F>(a: Parser<A>, b: Parser<B>, c: Parser<C>, d: Parser<D>, e: Parser<E>, f: Parser<F>): Parser<A | B | C | D | E | F>;
export function oneOf(...ps: Parser<any>[]): Parser<any> {
    return alt(...ps);
}

export const fold = <T>(p: Parser<T[]>, f: (prev: T, head: T) => T) => map(p, res => res.reduce(f));

export const leftassoc = <A, B, T>(
    l: Parser<A>,
    r: Parser<B>,
    f: (prev: T | A, val: B) => T
): Parser<T | A> => {
    return map(
        seq(l, many(r)),
        ([h, tl]) => tl.length === 0 ? h : tl.reduce(f, h as T | A)
    );
};

export const rightassoc = <A, B, T>(
    l: Parser<A>,
    r: Parser<B>,
    f: (prev: T | B, val: A) => T
): Parser<T | B> => {
    return map(
        seq(many(l), r),
        ([tl, h]) => tl.length === 0 ? h : tl.reduce(f, h as T | B)
    );
};

/**
 * utility function to parse an input string with the given parser
 * it handles the tokenization and the creation of an internal state
 * and attempts to process the entire input
 * @param input the string to parse
 * @param parser the parser to use
 */
export const parse = <T>(
    input: string,
    parser: Parser<T>
): Result<T, ParserError | LexerError> => {
    return bind(mapResult([...lex(input)], x => x), tokens => {
        const state = { tokens, pos: 0 };
        const res = parser(state);
        if (state.pos !== state.tokens.length) {
            return error(`Unexpected token: ${formatToken(state.tokens[state.pos])}`);
        }

        return res;
    });
};