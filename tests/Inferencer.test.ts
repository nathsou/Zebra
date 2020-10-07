import { assert } from "https://deno.land/std@0.73.0/testing/asserts.ts";
import { boolTy, funTy, intTy } from "../src/Inferencer/FixedTypes.ts";
import { inferExprType } from "../src/Inferencer/Inferencer.ts";
import { MonoTy, showMonoTy } from "../src/Inferencer/Types.ts";
import { unify } from "../src/Inferencer/Unification.ts";
import { parse } from "../src/Parser/Combinators.ts";
import { expr } from "../src/Parser/Parser.ts";
import { isSome } from "../src/Utils/Mabye.ts";
import { bind, isError, ok } from "../src/Utils/Result.ts";

const assertSameTypes = (a: MonoTy, b: MonoTy): void => {
    assert(isSome(unify(a, b)));
};

const assertType = (exp: string, ty: MonoTy): void => {
    const res = bind(parse(exp, expr), e => {
        return bind(inferExprType(e), tau => {
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
        return bind(inferExprType(e), tau => {
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