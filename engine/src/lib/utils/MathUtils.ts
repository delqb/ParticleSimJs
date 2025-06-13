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