import { Parser, ParserRef } from "./Combinators";
import { Decl } from "./Decl";
import { Expr } from "./Expr";
export declare const expr: ParserRef<Expr>;
export declare const decl: Parser<Decl>;
export declare const program: Parser<Decl[]>;
