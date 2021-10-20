import { isNone, isSome, Maybe } from "../Utils/Maybe";
import { error, ok, Result } from "../Utils/Result";
import { Position, showPosition, Punctuation, Token, KeywordType, } from "./Token";

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
    ['|', 'pipe'],
    ['::', 'cons'],
    [':', 'colon'],
    ['=>', 'bigarrow']
]);

const keywords: KeywordType[] = [
    'let', 'rec', 'in', 'if', 'then', 'else', 'data',
    'case', 'of', 'class', 'instance', 'where', 'import', 'export'
];

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

        // characters
        if (cur === "'") {
            let chr = '';

            // skip the opening '
            advance();

            chr = current() ?? '';
            advance();

            if (current() !== "'") {
                yield error(`missing closing "'"`);
            }

            // skip the closing '
            advance();

            yield ok({ type: 'char', value: chr, ...pos });
            continue;
        }

        // strings
        if (cur === '"') {
            let str = '';

            // skip the opening '
            advance();

            while (isSome(current()) && current() !== '"') {
                str += current();
                advance();
            }

            if (current() !== '"') {
                yield error(`missing closing '"'`);
            }

            // skip the closing '
            advance();

            yield ok({ type: 'string', value: str, ...pos });
            continue;
        }

        // variables
        if (/[a-z_']/.test(cur)) {
            let f = '';
            do {
                f += current();
                advance();
            } while (/[a-zA-Z0-9_']/.test(current() ?? ''));

            yield ok({ type: 'variable', name: f, ...pos });
            continue;
        }

        // identifiers
        if (/[A-Z]/.test(cur)) {
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

        // integers and floats
        if (isDigit(cur)) {
            let n = '';
            let isFloat = false;

            do {
                n += current();
                advance();
            } while (isDigit(current() ?? ''));

            // float
            if (current() === '.') {
                advance();
                n += '.';
                isFloat = true;

                do {
                    n += current();
                    advance();
                } while (isDigit(current() ?? ''));
            }

            if (isFloat) {
                yield ok({ type: 'float', value: parseFloat(n), ...pos });
            } else {
                yield ok({ type: 'integer', value: parseInt(n), ...pos });
            }

            continue;
        }

        yield error(`Unrecognized token near "${input.substr(offset, 10)}", at ${showPosition(pos)}`);
        return;
    }
}

const isDigit = (c: string) => {
    const code = c.charCodeAt(0);
    return code >= 48 && code <= 57
};