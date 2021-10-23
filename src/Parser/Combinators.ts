import { isSome, Maybe, None } from "../Utils/Maybe";
import { bind, error, isError, isOk, mapResult, ok, Result } from "../Utils/Result";
import { lex, LexerError } from "./Lexer";
import { KeywordType, showPosition, showToken, Tok, Token, TokenType } from "./Token";

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
export type ParserRef<T> = { ref: Parser<T> };

type AnyParser<T> = Parser<T> | ParserRef<T>;

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

const parserOf = <T>(p: AnyParser<T>): Parser<T> => {
  if (typeof p === 'object') return p.ref;
  return p;
};

// could variadic tuple types help here?
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

/**
 * applies p at least once
 */
export const many = <T>(p: AnyParser<T>): Parser<T[]> => state => {
  const values: T[] = [];

  let res = parserOf(p)(state);

  while (isOk(res)) {
    values.push(res.value);
    res = parserOf(p)(state);
  }

  return ok(values);
};

/**
 * applies p zero or more times
 */
export const some = <T>(p: AnyParser<T>): Parser<T[]> => state => {
  const values: T[] = [];

  let res: ParserResult<T>;

  while (true) {
    res = parserOf(p)(state);
    if (isError(res)) break;
    values.push(res.value);
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
  return map(seq(token('lparen'), p, token('rparen')), ([_l, res, _r]) => res);
};

export const maybeParens = <T>(p: AnyParser<T>): Parser<T> => {
  return alt(p, parens(p));
}

/**
 * parses a value surrounded by square brackets
 * @param p the parser matching the value between the square brackets
 */
export const brackets = <T>(p: AnyParser<T>): Parser<T> => {
  return map(seq(token('lbracket'), p, token('rbracket')), ([_l, res, _r]) => res);
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
export const sepBy = <T>(
  p: AnyParser<T>,
  separator: TokenType,
  acceptTrailing = false
): Parser<T[]> => {
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
        if (acceptTrailing && values.length > 0) {
          return ok(values);
        } else {
          return res;
        }
      } else {
        values.push(res.value);
      }
    } while (current(state)?.type === separator);

    return ok(values);
  };
};

export function oneOf<A>(a: AnyParser<A>): Parser<A>;
export function oneOf<A, B>(a: AnyParser<A>, b: AnyParser<B>): Parser<A | B>;
export function oneOf<A, B, C>(a: AnyParser<A>, b: AnyParser<B>, c: AnyParser<C>): Parser<A | B | C>;
export function oneOf<A, B, C, D>(a: AnyParser<A>, b: AnyParser<B>, c: AnyParser<C>, d: AnyParser<D>): Parser<A | B | C | D>;
export function oneOf<A, B, C, D, E>(a: AnyParser<A>, b: AnyParser<B>, c: AnyParser<C>, d: AnyParser<D>, e: AnyParser<E>): Parser<A | B | C | D | E>;
export function oneOf<A, B, C, D, E, F>(a: AnyParser<A>, b: AnyParser<B>, c: AnyParser<C>, d: AnyParser<D>, e: AnyParser<E>, f: AnyParser<F>): Parser<A | B | C | D | E | F>;
export function oneOf<A, B, C, D, E, F, G>(a: AnyParser<A>, b: AnyParser<B>, c: AnyParser<C>, d: AnyParser<D>, e: AnyParser<E>, f: AnyParser<F>, g: AnyParser<G>): Parser<A | B | C | D | E | F | G>;
export function oneOf(...ps: AnyParser<any>[]): AnyParser<any> {
  return alt(...ps);
}

export const fold = <T>(p: Parser<T[]>, f: (prev: T, head: T) => T) => map(p, res => res.reduce(f));

export const leftassoc = <A, B, T>(
  l: AnyParser<A>,
  r: AnyParser<B>,
  f: (prev: T | A, val: B) => T
): Parser<T | A> => {
  return map(
    seq(l, many(r)),
    ([h, tl]) => tl.length === 0 ? h : tl.reduce(f, h as T | A)
  );
};

export const rightassoc = <A, B, T>(
  l: AnyParser<A>,
  r: AnyParser<B>,
  f: (prev: T | B, val: A) => T
): Parser<T | B> => {
  return map(
    seq(some(l), r),
    ([tl, h]) => tl.length === 0 ? h : tl.reduce(f, h as T | B)
  );
};

export const cache = <T>(p: AnyParser<T>): Parser<T> => {
  let cachedRes: ParserResult<T> | null = null;

  return (state: ParserState) => {
    if (cachedRes === null) {
      cachedRes = parserOf(p)(state);
    }

    return cachedRes;
  };
};

export const using = <T, U>(
  f: (x: U) => Parser<T>,
  x: () => U
): Parser<T> => {
  return f(x());
};

export const optional = <T>(p: AnyParser<T>): Parser<Maybe<T>> => state => {
  const res = parserOf(p)(state);
  if (isError(res)) return ok(None);
  return ok(res.value);
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
  parser: AnyParser<T>
): Result<T, ParserError | LexerError> => {
  return bind(mapResult([...lex(input)], x => x), tokens => {
    const state = { tokens, pos: 0 };
    const res = parserOf(parser)(state);
    if (state.pos !== state.tokens.length) {
      return error(`Unexpected token: ${formatToken(state.tokens[state.pos])}`);
    }

    return res;
  });
};