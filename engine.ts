export type Vec2 = { x: number, y: number };
export type EntityID = string;

export function createUID(): EntityID {
    return `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
}

export const Vector2 = {
    create: (x = 0, y = 0): Vec2 => ({ x, y }),

    add: (a: Vec2, b: Vec2): Vec2 => ({ x: a.x + b.x, y: a.y + b.y }),

    subtract: (a: Vec2, b: Vec2): Vec2 => ({ x: a.x - b.x, y: a.y - b.y }),

    scale: (v: Vec2, scalar: number): Vec2 => ({ x: v.x * scalar, y: v.y * scalar }),

    dot: (a: Vec2, b: Vec2): number => a.x * b.x + a.y * b.y,

    magnitude: (v: Vec2): number => Math.sqrt(v.x * v.x + v.y * v.y),

    normalize: (v: Vec2): Vec2 => {
        const mag = Vector2.magnitude(v)
        return mag === 0 ? { x: 0, y: 0 } : { x: v.x / mag, y: v.y / mag }
    },
    distance: (a: Vec2, b: Vec2): number =>
        Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2),

    // the clockwise, radian angle between the positive x axis with vector 'a' as the origin and the line from vector 'a' to vector 'b'
    angle: (a: Vec2, b: Vec2): number => {
        let diff = Vector2.subtract(b, a);
        return Math.atan2(diff.y, diff.x);
    },
    copy: (v: Vec2): Vec2 => {
        return { x: v.x, y: v.y };
    }
}