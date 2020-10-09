
export const partition = <T>(vals: T[], pred: (v: T) => boolean): [T[], T[]] => {
    const as: T[] = [];
    const bs: T[] = [];

    for (const v of vals) {
        if (pred(v)) {
            as.push(v);
        } else {
            bs.push(v);
        }
    }

    return [as, bs];
};

export const gen = <T>(count: number, f: (n: number) => T): T[] => {
    const vals: T[] = [];

    for (let i = 0; i < count; i++) {
        vals.push(f(i));
    }

    return vals;
};