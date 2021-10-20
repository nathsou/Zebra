import { PrimitiveFunction } from "../../Inferencer/Primitives";
import { cache, mapOf } from "../../Utils/Common";

const plusInt = `
    function plusInt(a) {
        return b => a + b;
    }
`;

const minusInt = `
    function minusInt(a) {
        return b => a - b;
    }
`;

const timesInt = `
    function timesInt(a) {
        return b => a * b;
    }
`;

const divideInt = `
    function divideInt(a) {
        return b => Math.floor(a / b);
    }
`;

const modInt = `
    function modInt(a) {
        return b => a % b;
    }
`;

const eqInt = `
    function eqInt(a) {
        return b => a === b;
    }
`;

const lssInt = `
    function lssInt(a) {
        return b => a < b;
    }
`;

const leqInt = `
    function leqInt(a) {
        return b => a <= b;
    }
`;

const gtrInt = `
    function gtrInt(a) {
        return b => a > b;
    }
`;

const geqInt = `
    function geqInt(a) {
        return b => a >= b;
    }
`;

const stringOfInt = `
    function stringOfInt(n) {
        let res = { name: "Nil", args: [] };
        const chars = n.toString();

        for (let i = chars.length - 1; i >= 0; i--) {
            res = { name: "Cons", args: [chars[i], res] };
        }

        return res;
    }
`;

const plusFloat = `
    function plusFloat(a) {
        return b => a + b;
    }
`;

const minusFloat = `
    function minusFloat(a) {
        return b => a + b;
    }
`;

const timesFloat = `
    function timesFloat(a) {
        return b => a * b;
    }
`;

const divideFloat = `
    function divideFloat(a) {
        return b => a / b;
    }
`;

const eqFloat = `
    function eqFloat(a) {
        return b => a === b;
    }
`;

const lssFloat = `
    function lssFloat(a) {
        return b => a < b;
    }
`;

const leqFloat = `
    function leqFloat(a) {
        return b => a <= b;
    }
`;

const gtrFloat = `
    function gtrFloat(a) {
        return b => a > b;
    }
`;

const geqFloat = `
    function gtrFloat(a) {
        return b => a >= b;
    }
`;

const stringOfFloat = `
    function stringOfFloat(n) {
        let res =  { name: "Nil", args: [] };
        const chars = n.toString();

        for (let i = chars.length - 1; i >= 0; i--) {
            res = { name: "Cons", args: [chars[i], res] };
        }

        return res;
    }
`;

const floatOfInt = `
    function floatOfInt(n) {
        return n;
    }
`;

const eqChar = `
    function eqChar(a) {
        return b => a === b;
    }
`;

const jsPrimitivesObj: { [name in PrimitiveFunction]: string } = {
    'plusInt': plusInt,
    'minusInt': minusInt,
    'timesInt': timesInt,
    'divideInt': divideInt,
    'modInt': modInt,
    'eqInt': eqInt,
    'lssInt': lssInt,
    'leqInt': leqInt,
    'gtrInt': gtrInt,
    'geqInt': geqInt,
    'stringOfInt': stringOfInt,
    'plusFloat': plusFloat,
    'minusFloat': minusFloat,
    'timesFloat': timesFloat,
    'divideFloat': divideFloat,
    'eqFloat': eqFloat,
    'lssFloat': lssFloat,
    'leqFloat': leqFloat,
    'gtrFloat': gtrFloat,
    'geqFloat': geqFloat,
    'stringOfFloat': stringOfFloat,
    'floatOfInt': floatOfInt,
    'eqChar': eqChar
};

export const jsPrimitives = cache(() => mapOf(jsPrimitivesObj));