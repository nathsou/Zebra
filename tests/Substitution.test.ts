import { assert } from "https://deno.land/std@0.73.0/testing/asserts.ts";
import { funTy, intTy } from "../src/Inferencer/FixedTypes.ts";
import { freshTyVar, polyTy, polyTypesEq, resetTyVars } from "../src/Inferencer/Types.ts";
import { substitutePoly, TypeSubst } from "../src/Inferencer/Unification.ts";

Deno.test('substitutePoly', () => {
    const α = freshTyVar();

    // α -> int
    const σ: TypeSubst = { [α]: intTy };

    // γ: ∀α. α -> α
    const γ = polyTy(funTy(α, α));

    const σγ = substitutePoly(γ, σ);

    assert(polyTypesEq(σγ, polyTy(funTy(intTy, intTy))));

    resetTyVars();
});