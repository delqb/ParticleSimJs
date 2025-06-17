export const PI = Math.PI, PI2 = PI * 2, hPI = PI / 2;

export function shortestAngleDiff(a: number, b: number): number {
    let diff = (b - a) % PI2;
    if (diff > Math.PI) diff -= PI2;
    if (diff < -Math.PI) diff += PI2;
    return diff;
}

export function round(num: number, decimalPlaces = 3): number {
    return Math.round(num * 10 ** decimalPlaces) / 10 ** decimalPlaces;
}

export function lerp(start: number, end: number, t: number): number {
    return start + (end - start) * t;
}

export function boundedRandom(min: number, max: number): number {
    return min + (max - min) * Math.random();
}

/* 
    From the internet:
    Szudzik's pairing function composed with ZigZag encoding
*/
export function encodeIntegerPair(x: number, y: number): number {
    const X = x >= 0 ? 2 * x : -2 * x - 1;
    const Y = y >= 0 ? 2 * y : -2 * y - 1;
    return X >= Y ? X * X + X + Y : Y * Y + X;
}