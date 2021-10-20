import { CoreDecl } from "../../Core/CoreDecl";
import { CoreExpr } from "../../Core/CoreExpr";
import { Program } from "../../Parser/Program";
import { PrimDecl } from "./PrimitiveDecl";
import { PrimExpr } from "./PrimitiveExpr";
export declare const primitiveProgramOfCore: (coreProg: CoreDecl[]) => PrimDecl[];
export declare const primitiveProgramOf: (prog: Program) => PrimDecl[];
export declare const primitiveOf: (e: CoreExpr) => PrimExpr;
export declare const showPrim: (e: PrimExpr) => string;
