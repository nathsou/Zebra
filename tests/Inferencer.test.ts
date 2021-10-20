import { assert } from "https://deno.land/std@0.83.0/testing/asserts";
import { casifyFunctionDeclarations, coreOf } from "../src/Core/Casify";
import { partitionDecls } from "../src/Core/CoreDecl";
import { singleExprProgOf } from "../src/Core/ExprOfFunDecls";
import { boolTy, funTy, intTy } from "../src/Inferencer/FixedTypes";
import { inferExprType, registerTypeDecls } from "../src/Inferencer/Inferencer";
import { MonoTy, polyTy, showMonoTy, tyConst, TypeEnv, tyVar } from "../src/Inferencer/Types";
import { unify } from "../src/Inferencer/Unification";
import { parse } from "../src/Parser/Combinators";
import { FuncDecl } from "../src/Parser/Decl";
import { expr, program } from "../src/Parser/Parser";
import { isSome, Maybe } from "../src/Utils/Maybe";
import { bind, isError, ok } from "../src/Utils/Result";

const gamma: TypeEnv = {
    'True': polyTy(boolTy),
    'False': polyTy(boolTy)
};

const assertSameTypes = (a: MonoTy, b: MonoTy): void => {
    assert(isSome(unify(a, b)));
};

const assertType = (exp: string, ty: MonoTy): void => {
    const res = bind(parse(exp, expr), e => {
        return bind(inferExprType(coreOf(e), gamma), ([tau]) => {
            assertSameTypes(tau, ty);
            return ok('');
        });
    });

    if (isError(res)) {
        throw new Error(res.value);
    }
};

const assertMainType = (prog: string, ty: MonoTy): void => {
    const res = bind(parse(prog, program), decls => {
        assert(decls.some(d => d.type === 'fun' && d.funName.name === 'main'));

        const coreProg = casifyFunctionDeclarations(decls);
        const pdecls = partitionDecls(coreProg);

        const prog = singleExprProgOf(pdecls, true);

        registerTypeDecls([
            ...pdecls.dataTypeDecls,
            ...pdecls.instanceDecls,
            ...pdecls.typeClassDecls
        ]);

        return bind(inferExprType(prog), ([tau]) => {
            assertSameTypes(tau, ty);
            return ok('');
        });
    });

    if (isError(res)) {
        throw new Error(res.value);
    }
};

const assertTypeError = (exp: string): void => {
    bind(parse(exp, expr), e => {
        return bind(inferExprType(coreOf(e), gamma), ([tau]) => {
            throw new Error(`expected ${exp} to produce a type error, got: "${showMonoTy(tau)}"`);
        });
    });
};

Deno.test('infer constant type', () => {
    assertType('True', boolTy);
    assertType('False', boolTy);
    assertType('3', intTy);
    assertType('1789', intTy);
    assertType('21', intTy);
    assertType('0', intTy);
});

Deno.test('infer binop type', () => {
    // arithmetic binary operators
    assertType('2 + 3', intTy);
    assertType('2 - 3', intTy);
    assertType('2 * 3', intTy);
    assertType('2 / 3', intTy);
    assertType('2 % 3', intTy);

    // comparison operators
    assertType('2 < 3', boolTy);
    assertType('2 > 3', boolTy);
    assertType('2 <= 3', boolTy);
    assertType('2 >= 3', boolTy);
    assertType('2 == 3', boolTy);
});

Deno.test('infer if then else type', () => {
    assertType('if True then 1 else 2', intTy);
    assertType('if False then 1 else 2', intTy);
    assertType('if True then False else True', boolTy);
    assertTypeError('if True then False else 3');
    assertTypeError('if 1 then False else True');
    assertTypeError('if 1 then False 1 2');
});

Deno.test('infer lambda type', () => {
    assertType('\\n -> n + 1', funTy(intTy, intTy));
    assertType('\\a -> \\b -> a * b', funTy(intTy, intTy, intTy));
    assertType('\\a b -> a * b', funTy(intTy, intTy, intTy));
    assertType('\\a -> \\b -> \\c -> a * b + c', funTy(intTy, intTy, intTy, intTy));
    assertType('\\a b c -> a / b == c', funTy(intTy, intTy, intTy, boolTy));
    assertType('\\b -> if b then False else True', funTy(boolTy, boolTy));
    assertType('\\b -> if b then 1 else 0', funTy(boolTy, intTy));

    assertType('\\x -> x', funTy(intTy, intTy));
    assertType('\\x -> x', funTy(boolTy, boolTy));
    assertType('\\x -> x', funTy(funTy(intTy, intTy), funTy(intTy, intTy)));
});

Deno.test('infer function application type', () => {
    assertType('(\\n -> n + 1) 0', intTy);
    assertType('(\\b -> if b then False else True) True', boolTy);
    assertType('(\\b -> if b then False else True) False', boolTy);

    assertType('(\\x -> x) False', boolTy);
    assertType('(\\x -> x) 7', intTy);
    assertType('(\\x -> x) (\\x -> x)', funTy(boolTy, boolTy));
    assertType('(\\x -> x) (\\x -> x)', funTy(intTy, intTy));

    assertType('((\\x -> x) (\\x -> x)) 7', intTy);
    assertType('((\\x -> x) (\\x -> x)) True', boolTy);
    assertType('((\\x -> x) (\\x -> x) (\\a -> a)) False', boolTy);

    assertType('(\\a -> \\b -> \\c -> a + b + c) 1 2 3', intTy);
    assertType('(\\a b c -> a + b + c) 1 2 3', intTy);
});

Deno.test('infer let in type', () => {
    assertType('let n = 3 in let m = 7 in n * m', intTy);
    assertType('let n = 3 in let m = 7 in n * m == 21', boolTy);
    assertType('let not = \\b -> if b then False else True in not', funTy(boolTy, boolTy));
    assertType('let not = \\b -> if b then False else True in not True', boolTy);
});

Deno.test('infer let rec in type', () => {
    assertType('let rec f n = n % 2 == 0 in f', funTy(intTy, boolTy));
    assertType('let rec f n = n % 2 == 0 in f 17', boolTy);
    assertType('let rec f n = if n == 0 then 1 else n * (f (n - 1)) in f', funTy(intTy, intTy));
    assertType('let rec f n = if n == 0 then 1 else n * (f (n - 1)) in f 7', intTy);
    assertType(
        'let rec even n = if n == 0 then True else ' +
        'if n == 1 then False else even (n - 2) in even 17',
        boolTy
    );

    assertType(`let or = \\a b -> if a then True else b in
        
        let is_prime = \\n ->
            if n == 2 then True
            else if or (n < 2) (n % 2 == 0) then False
            else let rec aux n i = 
                if i * i >= n then True
                else if n % i == 0 then False
                else aux n (i + 2)
            in aux n 3
        in is_prime 1789`,
        boolTy
    );
});

Deno.test('infer sum types', () => {
    assertMainType(`
        data List a = Nil | Cons a (List a);
        main = let lst = Nil in lst;
    `,
        tyConst('List', tyVar(0))
    );

    assertMainType(`
        data List a = Nil | Cons a (List a);
        data Bool = True | False;
        data Pair a b = MkPair a b;

        main = let lst = Nil in MkPair (Cons 3 lst) (Cons False lst);
    `,
        tyConst('Pair', tyConst('List', intTy), tyConst('List', boolTy))
    );

    assertMainType(`
        data List a = Nil | Cons a (List a);
        data Pair a b = MkPair a b;

        main = let (MkPair fst snd) = MkPair 1 (Cons 3 Nil) in snd;
    `,
        tyConst('List', intTy)
    );

    // assertMainType(`
    //     data List a = Nil | Cons a (List a);
    //     data Pair a b = MkPair a b;

    //     main = let (MkPair fst snd) = MkPair 1 (Cons 3 Nil) in fst;
    // `,
    //     intTy
    // );

    assertMainType(`
        data List a = Nil | Cons a (List a);
        data Pair a b = MkPair a b;

        main = let rec snd (MkPair a b) = b in snd (MkPair 1 (Cons 3 Nil));
    `,
        tyConst('List', intTy)
    );
});