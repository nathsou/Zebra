
export type Token =
    | Punctuation
    | Symbol
    | Identifier
    | Variable
    | Integer
    | Float
    | Char
    | String
    | Keyword
    | Comment
    | EOF;

export type TokenType =
    Punctuation['type'] | 'symbol' | 'keyword' | 'variable' |
    'identifier' | 'integer' | 'float' | 'char' | 'string' | 'comment' | 'EOF';

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
    | Tok<'colon'>
    | Tok<'bigarrow'>
    | Tok<'pipe'>;

export type Position = {
    line: number;
    column: number;
};

export type Tok<Name extends TokenType, T =
    Record<string, unknown>> = Position & { type: Name } & T;

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

type Float = Tok<'float', {
    value: number
}>;

type Char = Tok<'char', {
    value: string
}>;

type String = Tok<'string', {
    value: string
}>;

type Comment = Tok<'comment', {
    value: string
}>;

export type KeywordType =
    'let' | 'rec' | 'in' | 'if' | 'then' |
    'else' | 'data' | 'case' | 'of' | 'class' | 'instance' | 'where';

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
    'semicolon': ';',
    'colon': ':',
    'bigarrow': '=>'
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
        case 'char':
            return `'${t.value}'`;
        case 'float':
            return t.value.toString();
        case 'string':
            return `"${t.value}"`;
        default:
            return tokenSymbs[t.type];
    }
};

export const showPosition = ({ line, column }: Position) => {
    return `${line}:${column}`;
};