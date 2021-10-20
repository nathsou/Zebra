import { MonoTy } from "../Inferencer/Types";
import { Result } from "../Utils/Result";
export declare const compileCroco: (path: string) => Promise<Result<[ty: MonoTy, croco: string], string>>;
