import { isNone, Maybe } from "../Utils/Mabye.ts";
import { error, ok, Result } from "../Utils/Result.ts";
import { Position, showPosition, Punctuation, Token, KeywordType, } from "./Token.ts";

const punctuations = new Map<string, Punctuation['type']>([
    ['(', 'lparen'],
    [')', 'rparen'],
    ['[', 'lbracket'],
    [']', 'rbracket'],
    ['->', 'rightarrow'],
    ['.', 'dot'],
    [',', 'comma'],
    ['\\', 'lambda'],
    [';', 'semicolon'],
    ['|', 'pipe']
]);

const keywords: KeywordType[] = ['let', 'rec', 'in', 'if', 'then', 'else', 'data'];

export type LexerError = string;

export function* lex(input: string): Iterable<Result<Token, LexerError>> {
    let offset = 0;
    let pos: Position = { line: 1, column: 1 };

    const advance = (n = 1) => {
        for (let i = 0; i < n; i++) {
            if (current() === '\n') {
                pos.line++;
                pos.column = 1;
            } else {
                pos.column++;
            }

            offset++;
        }
    };

    const current = (): Maybe<string> => input[offset];
    const lookahead = (len = 1): string => input.substr(offset, len);

    const skipSpaces = () => {
        while (offset < input.length && [' ', '\n', '\r', '\t'].includes(current() ?? '')) {
            advance();
        }
    };

    lexerLoop:
    while (offset < input.length) {
        skipSpaces();

        const cur = current();
        if (isNone(cur)) break;

        // recognize punctuations
        for (const [symb, type] of punctuations.entries()) {
            if (lookahead(symb.length) === symb) {
                yield ok({ type, ...pos });
                advance(symb.length);
                continue lexerLoop;
            }
        }

        // recognize keywords
        for (const keyword of keywords) {
            if (
                lookahead(keyword.length + 1) === `${keyword} ` ||
                lookahead(keyword.length + 1) === `${keyword}\n`
            ) {
                yield ok({ type: 'keyword', value: keyword, ...pos });
                advance(keyword.length);
                continue lexerLoop;
            }
        }

        // identifiers
        if (/[a-zA-Z_]/.test(cur)) {
            let f = '';
            do {
                f += current();
                advance();
            } while (/[a-zA-Z0-9_]/.test(current() ?? ''));

            yield ok({ type: 'identifier', name: f, ...pos });
            continue;
        }

        // skip comments
        if (lookahead(2) === '--') {
            do {
                advance();
            } while (offset < input.length && current() !== '\n');
            continue;
        }

        // symbols
        if (/[!#$%&*+.\/<=>\?@\\^\|\-~]/.test(cur)) {
            let symb = '';
            do {
                symb += current();
                advance();
            } while (/[!#$%&*+.\/<=>\?@\\^\|\-~]/.test(current() ?? ''));

            yield ok({ type: 'symbol', name: symb, ...pos });
            continue;
        }

        // integers
        if (/[0-9]/.test(cur)) {
            let n = '';
            do {
                n += current();
                advance();
            } while (/[0-9]/.test(current() ?? ''));

            yield ok({ type: 'integer', value: parseInt(n), ...pos });
            continue;
        }

        yield error(`Unrecognized token near "${input.substr(offset, 10)}", at ${showPosition(pos)}`);
        return;
    }
}