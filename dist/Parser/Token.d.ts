export declare type Token = Punctuation | Symbol | Identifier | Variable | Integer | Float | Char | String | Keyword | Comment | EOF;
export declare type TokenType = Punctuation['type'] | 'symbol' | 'keyword' | 'variable' | 'identifier' | 'integer' | 'float' | 'char' | 'string' | 'comment' | 'EOF';
export declare type Punctuation = Tok<'lparen'> | Tok<'rparen'> | Tok<'lbracket'> | Tok<'rbracket'> | Tok<'comma'> | Tok<'rightarrow'> | Tok<'lambda'> | Tok<'dot'> | Tok<'semicolon'> | Tok<'cons'> | Tok<'colon'> | Tok<'bigarrow'> | Tok<'pipe'>;
export declare type Position = {
    line: number;
    column: number;
};
export declare type Tok<Name extends TokenType, T = Record<string, unknown>> = Position & {
    type: Name;
} & T;
declare type Symbol = Tok<'symbol', {
    name: string;
}>;
declare type Identifier = Tok<'identifier', {
    name: string;
}>;
declare type Variable = Tok<'variable', {
    name: string;
}>;
declare type Integer = Tok<'integer', {
    value: number;
}>;
declare type Float = Tok<'float', {
    value: number;
}>;
declare type Char = Tok<'char', {
    value: string;
}>;
declare type String = Tok<'string', {
    value: string;
}>;
declare type Comment = Tok<'comment', {
    value: string;
}>;
export declare type KeywordType = 'let' | 'rec' | 'in' | 'if' | 'then' | 'else' | 'data' | 'case' | 'of' | 'class' | 'instance' | 'where' | 'import' | 'export';
declare type Keyword = Tok<'keyword', {
    value: KeywordType;
}>;
declare type EOF = Tok<'EOF'>;
export declare const showToken: (t: Token) => string;
export declare const showPosition: ({ line, column }: Position) => string;
export {};
