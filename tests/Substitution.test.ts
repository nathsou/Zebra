import { assert } from "https://deno.land/std@0.83.0/testing/asserts.ts";
import { clearContext } from "../src/Inferencer/Context.ts";
import { funTy, intTy } from "../src/Inferencer/FixedTypes.ts";
import { freshTyVar, polyTy, polyTypesEq } from "../src/Inferencer/Types.ts";
import { substitutePoly, TypeSubst } from "../src/Inferencer/Unification.ts";
import { isOk } from "../src/Utils/Result.ts";

Deno.test('substitutePoly', () => {
    const α = freshTyVar();

    // α -> int
    const σ: TypeSubst = { [α.value]: intTy };

    // γ: ∀α. α -> α
    const γ = polyTy(funTy(α, α));

    const σγ = substitutePoly(γ, σ);

    assert(isOk(σγ));
    assert(polyTypesEq(σγ.value, polyTy(funTy(intTy, intTy))));

    clearContext();
});