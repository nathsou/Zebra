import { assert } from "https://deno.land/std@0.83.0/testing/asserts";
import { clearContext } from "../src/Inferencer/Context";
import { funTy, intTy } from "../src/Inferencer/FixedTypes";
import { freshTyVar, polyTy, polyTypesEq } from "../src/Inferencer/Types";
import { substitutePoly, TypeSubst } from "../src/Inferencer/Unification";
import { isOk } from "../src/Utils/Result";

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