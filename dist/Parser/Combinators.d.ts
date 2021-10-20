import { Maybe } from "../Utils/Maybe";
import { Result } from "../Utils/Result";
import { LexerError } from "./Lexer";
import { KeywordType, Tok, Token, TokenType } from "./Token";
/**
 * type returned when parsing is unsuccessful
 */
export declare type ParserError = string;
export declare type ParserResult<T> = Result<T, ParserError>;
/**
 * A parser is a function attempting to match a pattern in
 * the tokens given as input
 *
 * parsers are not pure functions, the state's current token
 * position is mutated
 * @param T the type returned when parsing is successfull
 */
export declare type Parser<T> = (state: ParserState) => ParserResult<T>;
export declare type ParserRef<T> = {
    ref: Parser<T>;
};
declare type AnyParser<T> = Parser<T> | ParserRef<T>;
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
export declare const advance: (state: ParserState) => void;
export declare const current: ({ tokens, pos }: ParserState) => Maybe<Token>;
export declare function seq<A>(a: AnyParser<A>): Parser<[A]>;
export declare function seq<A, B>(a: AnyParser<A>, b: AnyParser<B>): Parser<[A, B]>;
export declare function seq<A, B, C>(a: AnyParser<A>, b: AnyParser<B>, c: AnyParser<C>): Parser<[A, B, C]>;
export declare function seq<A, B, C, D>(a: AnyParser<A>, b: AnyParser<B>, c: AnyParser<C>, d: AnyParser<D>): Parser<[A, B, C, D]>;
export declare function seq<A, B, C, D, E>(a: AnyParser<A>, b: AnyParser<B>, c: AnyParser<C>, d: AnyParser<D>, e: AnyParser<E>): Parser<[A, B, C, D, E]>;
export declare function seq<A, B, C, D, E, F>(a: AnyParser<A>, b: AnyParser<B>, c: AnyParser<C>, d: AnyParser<D>, e: AnyParser<E>, f: AnyParser<F>): Parser<[A, B, C, D, E, F]>;
export declare function seq<A, B, C, D, E, F, G>(a: AnyParser<A>, b: AnyParser<B>, c: AnyParser<C>, d: AnyParser<D>, e: AnyParser<E>, f: AnyParser<F>, g: AnyParser<G>): Parser<[A, B, C, D, E, F, G]>;
export declare function seq<A, B, C, D, E, F, G, H>(a: AnyParser<A>, b: AnyParser<B>, c: AnyParser<C>, d: AnyParser<D>, e: AnyParser<E>, f: AnyParser<F>, g: AnyParser<G>, h: AnyParser<H>): Parser<[A, B, C, D, E, F, G, H]>;
export declare const alt: <T>(...ps: AnyParser<T>[]) => Parser<T>;
export declare const map: <A, B>(p: Parser<A>, f: (v: A) => B) => Parser<B>;
/**
 * applies p at least once
 */
export declare const many: <T>(p: AnyParser<T>) => Parser<T[]>;
/**
 * applies p zero or more times
 */
export declare const some: <T>(p: AnyParser<T>) => Parser<T[]>;
/**
 * formats a token for debugging
 * @param t the token to format
 */
export declare const formatToken: (t: Maybe<Token>) => string;
/**
 * parses a single token of the specified type
 * @param type the type of token to be parsed
 */
export declare const token: <T extends TokenType>(type: T) => Parser<(import("./Token").Position & {
    type: T;
} & Record<string, unknown> & {
    type: "lparen";
}) | (import("./Token").Position & {
    type: T;
} & Record<string, unknown> & {
    type: "rparen";
}) | (import("./Token").Position & {
    type: T;
} & Record<string, unknown> & {
    type: "lbracket";
}) | (import("./Token").Position & {
    type: T;
} & Record<string, unknown> & {
    type: "rbracket";
}) | (import("./Token").Position & {
    type: T;
} & Record<string, unknown> & {
    type: "comma";
}) | (import("./Token").Position & {
    type: T;
} & Record<string, unknown> & {
    type: "rightarrow";
}) | (import("./Token").Position & {
    type: T;
} & Record<string, unknown> & {
    type: "lambda";
}) | (import("./Token").Position & {
    type: T;
} & Record<string, unknown> & {
    type: "dot";
}) | (import("./Token").Position & {
    type: T;
} & Record<string, unknown> & {
    type: "semicolon";
}) | (import("./Token").Position & {
    type: T;
} & Record<string, unknown> & {
    type: "cons";
}) | (import("./Token").Position & {
    type: T;
} & Record<string, unknown> & {
    type: "colon";
}) | (import("./Token").Position & {
    type: T;
} & Record<string, unknown> & {
    type: "bigarrow";
}) | (import("./Token").Position & {
    type: T;
} & Record<string, unknown> & {
    type: "pipe";
}) | (import("./Token").Position & {
    type: T;
} & Record<string, unknown> & {
    type: "symbol";
} & {
    name: string;
}) | (import("./Token").Position & {
    type: T;
} & Record<string, unknown> & {
    type: "identifier";
} & {
    name: string;
}) | (import("./Token").Position & {
    type: T;
} & Record<string, unknown> & {
    type: "variable";
} & {
    name: string;
}) | (import("./Token").Position & {
    type: T;
} & Record<string, unknown> & {
    type: "integer";
} & {
    value: number;
}) | (import("./Token").Position & {
    type: T;
} & Record<string, unknown> & {
    type: "float";
} & {
    value: number;
}) | (import("./Token").Position & {
    type: T;
} & Record<string, unknown> & {
    type: "char";
} & {
    value: string;
}) | (import("./Token").Position & {
    type: T;
} & Record<string, unknown> & {
    type: "string";
} & {
    value: string;
}) | (import("./Token").Position & {
    type: T;
} & Record<string, unknown> & {
    type: "keyword";
} & {
    value: KeywordType;
}) | (import("./Token").Position & {
    type: T;
} & Record<string, unknown> & {
    type: "comment";
} & {
    value: string;
}) | (import("./Token").Position & {
    type: T;
} & Record<string, unknown> & {
    type: "EOF";
})>;
/**
 * parses a single keyword
 * @param value the type of keyword
 */
export declare const keyword: <V extends KeywordType>(value: V) => Parser<Tok<"keyword", {
    value: V;
}>>;
/**
 * parses a single symbol
 * @param value the type of keyword
 */
export declare const symbol: <V extends string>(name: V) => Parser<Tok<"symbol", {
    name: V;
}>>;
/**
 * parses a value surrounded by parentheses
 * @param p the parser matching the value between the parentheses
 */
export declare const parens: <T>(p: AnyParser<T>) => Parser<T>;
export declare const maybeParens: <T>(p: AnyParser<T>) => Parser<T>;
/**
 * parses a value surrounded by square brackets
 * @param p the parser matching the value between the square brackets
 */
export declare const brackets: <T>(p: AnyParser<T>) => Parser<T>;
/**
 * parses a list of values separated by commas
 * @param p the parser matching comma separated values
 */
export declare const commas: <T>(p: AnyParser<T>) => Parser<T[]>;
/**
 * parses a list of values separated by the given token type
 * @param p the parser matching separated values
 */
export declare const sepBy: <T>(p: AnyParser<T>, separator: TokenType, acceptTrailing?: boolean) => Parser<T[]>;
export declare function oneOf<A>(a: AnyParser<A>): Parser<A>;
export declare function oneOf<A, B>(a: AnyParser<A>, b: AnyParser<B>): Parser<A | B>;
export declare function oneOf<A, B, C>(a: AnyParser<A>, b: AnyParser<B>, c: AnyParser<C>): Parser<A | B | C>;
export declare function oneOf<A, B, C, D>(a: AnyParser<A>, b: AnyParser<B>, c: AnyParser<C>, d: AnyParser<D>): Parser<A | B | C | D>;
export declare function oneOf<A, B, C, D, E>(a: AnyParser<A>, b: AnyParser<B>, c: AnyParser<C>, d: AnyParser<D>, e: AnyParser<E>): Parser<A | B | C | D | E>;
export declare function oneOf<A, B, C, D, E, F>(a: AnyParser<A>, b: AnyParser<B>, c: AnyParser<C>, d: AnyParser<D>, e: AnyParser<E>, f: AnyParser<F>): Parser<A | B | C | D | E | F>;
export declare function oneOf<A, B, C, D, E, F, G>(a: AnyParser<A>, b: AnyParser<B>, c: AnyParser<C>, d: AnyParser<D>, e: AnyParser<E>, f: AnyParser<F>, g: AnyParser<G>): Parser<A | B | C | D | E | F | G>;
export declare const fold: <T>(p: Parser<T[]>, f: (prev: T, head: T) => T) => Parser<T>;
export declare const leftassoc: <A, B, T>(l: AnyParser<A>, r: AnyParser<B>, f: (prev: A | T, val: B) => T) => Parser<A | T>;
export declare const rightassoc: <A, B, T>(l: AnyParser<A>, r: AnyParser<B>, f: (prev: B | T, val: A) => T) => Parser<B | T>;
export declare const cache: <T>(p: AnyParser<T>) => Parser<T>;
export declare const using: <T, U>(f: (x: U) => Parser<T>, x: () => U) => Parser<T>;
export declare const optional: <T>(p: AnyParser<T>) => Parser<Maybe<T>>;
/**
 * utility function to parse an input string with the given parser
 * it handles the tokenization and the creation of an internal state
 * and attempts to process the entire input
 * @param input the string to parse
 * @param parser the parser to use
 */
export declare const parse: <T>(input: string, parser: AnyParser<T>) => Result<T, string>;
export {};
