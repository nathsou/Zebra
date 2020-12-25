export type Token =
    | Punctuation
    | Symbol
    | Identifier
    | Variable
    | Integer
    | Keyword
    | Comment
    | EOF;

export type TokenType =
    Punctuation['type'] | 'symbol' | 'keyword' | 'variable' | 'identifier' | 'integer' | 'comment' | 'EOF';

export type Punctuation =
    | Tok<'lparen'>
    | Tok<'rparen'>
    | Tok<'lbracket'>
    | Tok<'rbracket'>
    | Tok<'comma'>
    | Tok<'rightarrow'>
    | Tok<'lambda'>
    | Tok<'dot'>
    | Tok<'semicolon'>
    | Tok<'cons'>
    | Tok<'pipe'>;

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

type Variable = Tok<'variable', {
    name: string
}>;

type Integer = Tok<'integer', {
    value: number
}>;

type Comment = Tok<'comment', {
    value: string
}>;

export type KeywordType = 'let' | 'rec' | 'in' | 'if' | 'then' | 'else' | 'data' | 'case' | 'of';

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
    'pipe': '|',
    'comma': ',',
    'lambda': '\\',
    'rightarrow': '->',
    'cons': '::',
    'semicolon': ';'
};

export const showToken = (t: Token): string => {
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
        default:
            return tokenSymbs[t.type];
    }
};

export const showPosition = ({ line, column }: Position) => {
    return `${line}:${column}`;
};