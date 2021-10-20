import { Result } from "../Utils/Result";
import { Token } from "./Token";
export declare type LexerError = string;
export declare function lex(input: string): Iterable<Result<Token, LexerError>>;
