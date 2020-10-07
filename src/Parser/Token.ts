export type Token =
    | Punctuation
    | Symbol
    | Identifier
    | TyConst
    | Integer
    | Keyword
    | Comment
    | EOF;

export type TokenType =
    Punctuation['type'] | 'symbol' | 'keyword' | 'identifier' | 'tyconst' | 'integer' | 'comment' | 'EOF';

export type Punctuation =
    | Tok<'lparen'>
    | Tok<'rparen'>
    | Tok<'lbracket'>
    | Tok<'rbracket'>
    | Tok<'comma'>
    | Tok<'rightarrow'>
    | Tok<'lambda'>
    | Tok<'dot'>
    | Tok<'semicolon'>;

export type Position = {
    line: number;
    column: number;
};

export type Tok<Name extends TokenType, T = Record<string, unknown>> = Position & { type: Name } & T;

type Symbol = Tok<'symbol', {
    name: string
}>;

type Identifier = Tok<'identifier', {
    name: string
}>;

type TyConst = Tok<'tyconst', {
    name: string,
    args: Token[]
}>;

type Integer = Tok<'integer', {
    value: number
}>;

type Comment = Tok<'comment', {
    value: string
}>;

export type KeywordType = 'let' | 'rec' | 'in' | 'if' | 'then' | 'else';

type Keyword = Tok<'keyword', {
    value: KeywordType
}>;

type EOF = Tok<'EOF'>;

const tokenSymbs = {
    'dot': '.',
    'lparen': '(',
    'rparen': ')',
    'lbracket': '[',
    'rbracket': ']',
    'comma': ',',
    'lambda': '\\',
    'rightarrow': '->',
    'semicolon': ';'
};

export const showToken = (t: Token): string => {
    switch (t.type) {
        case 'identifier':
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
        case 'tyconst':
            if (t.args.length === 0) {
                return t.name;
            }

            return `(${t.name} ${t.args.map(showToken).join(' ')})`;
        default:
            return tokenSymbs[t.type];
    }
};

export const showPosition = ({ line, column }: Position) => {
    return `${line}:${column}`;
};