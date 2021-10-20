import { Dict } from "../../Utils/Common";
import { PrimExpr } from "./PrimitiveExpr";
export declare const substitutePrim: (e: PrimExpr, subst: Dict<PrimExpr>) => PrimExpr;
