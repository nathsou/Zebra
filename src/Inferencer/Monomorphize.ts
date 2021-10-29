import { CoreFuncDecl } from "../Core/CoreDecl";
import { CoreExpr } from "../Core/CoreExpr";
import { context } from "../Inferencer/Context";
import { instanceMethodsTypes } from "../Inferencer/Inferencer";
import { expandTy, isTyOverloaded, MonoTy, showMonoTy } from "../Inferencer/Types";
import { directedUnify, substCompose, substituteMono, TypeSubst } from "../Inferencer/Unification";
import { InstanceDecl } from "../Parser/Decl";
import { VarExpr, varOf } from "../Parser/Expr";
import { Program } from "../Parser/Program";
import { lambdaOf } from "../Parser/Sugar";
import { bind, bind2, bind3, error, isError, isOk, ok, reduceResult, Result, Unit } from "../Utils/Result";

type ResolutionEnv = Map<string, [MonoTy, CoreExpr][]>;

const specializations = new Map<string, CoreExpr>();

// replace overloaded methods by their type-dependent definitions
// http://okmij.org/ftp/Computation/typeclass.html
export const monomorphizeProg = (
  prog: Program,
  sig: TypeSubst
): Result<CoreFuncDecl[], string> => {
  specializations.clear();
  const renv: ResolutionEnv = new Map();
  const res: CoreFuncDecl[] = [];

  for (const inst of prog.instances) {
    const res = addInstanceToResolutionEnv(inst, renv);
    if (isError(res)) return res;
  }

  for (const f of prog.coreFuncs.values()) {
    const ty = identifierType(f.funName, sig);
    if (isError(ty)) return ty;

    const m = monomorphizeFunDecl(f, ty.value, sig, renv);
    if (isError(m)) {
      return m;
    } else {
      res.push(...m.value);
    }
  }

  for (const [sp, expr] of specializations.entries()) {
    res.push({
      type: 'fun',
      funName: varOf(sp),
      args: [],
      body: expr
    });
  }

  return ok(res);
};

const addMapping = (f: string, ty: MonoTy, expr: CoreExpr, renv: ResolutionEnv): void => {
  if (!renv.has(f)) {
    renv.set(f, []);
  }

  // extend renv with a new mapping
  renv.get(f)?.push([ty, expr]);
};

const addInstanceToResolutionEnv = (
  inst: InstanceDecl,
  renv: ResolutionEnv
): Result<Unit, string> => {
  return bind(instanceMethodsTypes(inst), tys => {
    for (const [method, ty] of tys.entries()) {
      const [_, decl] = inst.defs.get(method)!;
      const e = decl.args.length > 0 ? lambdaOf(decl.args, decl.body) : decl.body;

      addMapping(method, ty, e, renv);
    }

    return ok('()' as const);
  });
};

const monomorphizeFunDecl = (
  f: CoreFuncDecl,
  ty: MonoTy,
  sig: TypeSubst,
  renv: ResolutionEnv
): Result<CoreFuncDecl[], string> => {
  const overloaded = isTyOverloaded(ty);
  if (overloaded && f.funName.name !== 'main') {
    addMapping(f.funName.name, ty, f.args.length > 0 ? lambdaOf(f.args, f.body) : f.body, renv);
    return ok([]);
  } else {
    return bind(monomorphizeExpr(f.body, sig, renv), body => {
      return ok([{
        ...f,
        body
      }]);
    });
  }
};

const findReplacement = (
  f: string,
  ty: MonoTy,
  sig: TypeSubst,
  renv: ResolutionEnv
): Result<CoreExpr, string> => {
  const key = `${f}_specialized_${expandTy(ty).join('_')}`;

  if (specializations.has(key)) {
    return ok(varOf(key));
  }

  for (const [tau, expr] of renv.get(f) ?? []) {
    const sigTy = substituteMono(ty, sig);
    if (isError(sigTy)) return sigTy;

    const sigTau = substituteMono(tau, sig);
    if (isError(sigTau)) return sigTau;

    const sig2 = directedUnify(sigTau.value, sigTy.value);

    // console.log(`${f} : ${showMonoTy(sigTau.value)} : ${showMonoTy(sigTy.value)}`);

    if (isOk(sig2)) {
      specializations.set(key, expr);
      return bind(substCompose(sig2.value, sig), sig21 => {
        return bind(monomorphizeExpr(expr, sig21, renv), rep => {
          specializations.set(key, rep);
          return ok(varOf(key));
        });
      });
    }
  }

  return error(`no replacement found for '${f}' with type '${showMonoTy((ty))}'`);
};

const identifierType = (v: VarExpr, sig: TypeSubst): Result<MonoTy, string> => {
  if (!context.identifiers.has(v.id)) {
    return error(`identifier ${v.name} (${v.id}) does not have type information`);
  }

  const [_, ty_] = context.identifiers.get(v.id)!;
  const ty = substituteMono(ty_.ty, sig);
  if (isError(ty)) return ty;

  return ok(ty.value);
};

const monomorphizeExpr = (e: CoreExpr, sig: TypeSubst, renv: ResolutionEnv): Result<CoreExpr, string> => {
  switch (e.type) {
    case 'variable': {
      if (context.datatypes.has(e.name)) {
        return ok(e);
      }

      if (renv.has(e.name)) {
        return bind(identifierType(e, sig), ty => {
          return bind(findReplacement(e.name, ty, sig, renv), rep => {
            return ok(rep);
          });
        });
      } else {
        return ok(e);
      }
    }

    case 'let_in':
      return bind2(
        monomorphizeExpr(e.middle, sig, renv),
        monomorphizeExpr(e.right, sig, renv),
        ([middle, right]) => {
          return ok({
            type: 'let_in' as const,
            left: e.left,
            middle,
            right
          });
        }
      );
    case 'let_rec_in':
      return bind2(
        monomorphizeExpr(e.middle, sig, renv),
        monomorphizeExpr(e.right, sig, renv),
        ([middle, right]) => {
          return ok({
            type: 'let_rec_in' as const,
            funName: e.funName,
            arg: e.arg,
            middle,
            right
          });
        }
      );

    case 'constant':
      return ok(e);

    case 'if_then_else': {
      return bind3(
        monomorphizeExpr(e.cond, sig, renv),
        monomorphizeExpr(e.thenBranch, sig, renv),
        monomorphizeExpr(e.elseBranch, sig, renv),
        ([cond, thenBranch, elseBranch]) => {
          return ok({
            type: 'if_then_else' as const,
            cond,
            thenBranch,
            elseBranch
          });
        }
      );
    }

    case 'app': {
      return bind2(
        monomorphizeExpr(e.lhs, sig, renv),
        monomorphizeExpr(e.rhs, sig, renv),
        ([lhs, rhs]) => {
          return ok({
            type: 'app' as const,
            lhs,
            rhs
          });
        }
      )
    }

    case 'lambda':
      return bind(monomorphizeExpr(e.body, sig, renv), body => {
        return ok({
          type: 'lambda' as const,
          arg: e.arg,
          body
        });
      });

    case 'case_of':
      return bind(monomorphizeExpr(e.value, sig, renv), value => {
        const cases = reduceResult(e.cases.map(({ expr, pattern }) => {
          return bind(monomorphizeExpr(expr, sig, renv), e => {
            return ok({ expr: e, pattern });
          });
        }));

        return bind(cases, cases => {
          return ok({
            type: 'case_of' as const,
            arity: e.arity,
            value,
            cases
          });
        });
      });

    case 'tyconst': {
      const args = reduceResult(e.args.map(a => monomorphizeExpr(a, sig, renv)));

      return bind(args, args => {
        return ok({
          type: 'tyconst' as const,
          name: e.name,
          args
        });
      });
    }
  }
};