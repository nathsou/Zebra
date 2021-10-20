import { MonoTy } from "../Inferencer/Types";
import { Result } from "../Utils/Result";
export declare const compileNaive: (path: string) => Promise<Result<[ty: MonoTy, js: string], string>>;
