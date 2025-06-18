export type Vec2 = { x: number, y: number };

export const isVec2 = (value: any): value is Vec2 =>
    typeof value === "object" && typeof value.x === "number" && typeof value.y === "number";

export class MVec2 implements Vec2 {
    constructor(public x: number, public y: number) {
    }
    static from(vec: Vec2): MVec2 {
        return new MVec2(vec.x, vec.y);
    }
    static fromAngle(angle: number): MVec2 {
        return new MVec2(Math.cos(angle), Math.sin(angle));
    }
    toImmutable(): Vec2 {
        return { x: this.x, y: this.y };
    }
    assign(x: number, y: number): MVec2 {
        this.x = x;
        this.y = y;
        return this;
    }
    setX(x: number): MVec2 {
        this.x = x;
        return this;
    }
    setY(y: number): MVec2 {
        this.y = y;
        return this;
    }
    setAs(vec: Vec2): MVec2 {
        this.x = vec.x;
        this.y = vec.y;
        return this;
    }
    add(vec: Vec2): MVec2 {
        this.x += vec.x;
        this.y += vec.y;
        return this;
    }
    subtract(vec: Vec2): MVec2 {
        this.x -= vec.x;
        this.y -= vec.y;
        return this;
    }
    multiply(vec: Vec2): MVec2 {
        this.x *= vec.x;
        this.y *= vec.y;
        return this;
    }
    divide(vec: Vec2): MVec2 {
        this.x /= vec.x;
        this.y /= vec.y;
        return this;
    }
    scale(scalar: number): MVec2 {
        this.x *= scalar;
        this.y *= scalar;
        return this;
    }
    dot(vec: Vec2): number {
        return this.x * vec.x + this.y * vec.y;
    }
    abs(): MVec2 {
        this.x = Math.abs(this.x);
        this.y = Math.abs(this.y);
        return this;
    }
    magnitude(): number {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }
    normalize(): MVec2 {
        const mag = this.magnitude();
        this.x /= mag;
        this.y /= mag;
        return this;
    }
    distance(vec: Vec2): number {
        return Math.sqrt((this.x - vec.x) ** 2 + (this.y - vec.y) ** 2);
    }
    angle(vec: Vec2): number {
        return Math.atan2(vec.y - this.y, vec.x - this.x);
    }
    copy(): MVec2 {
        return new MVec2(this.x, this.y);
    }
}

export const Vector2 = {
    zero: (): Vec2 => {
        return { x: 0, y: 0 };
    },

    create: (x = 0, y = 0): Vec2 => ({ x, y }),

    add: (a: Vec2, b: Vec2): Vec2 => ({ x: a.x + b.x, y: a.y + b.y }),

    subtract: (a: Vec2, b: Vec2): Vec2 => ({ x: a.x - b.x, y: a.y - b.y }),

    multiply: (a: Vec2, b: Vec2): Vec2 => ({ x: a.x * b.x, y: a.y * b.y }),

    divide: (a: Vec2, b: Vec2): Vec2 => ({ x: a.x / b.x, y: a.y / b.y }),

    scale: (v: Vec2, scalar: number): Vec2 => ({ x: v.x * scalar, y: v.y * scalar }),

    dot: (a: Vec2, b: Vec2): number => a.x * b.x + a.y * b.y,

    abs: (v: Vec2): Vec2 => ({ x: Math.abs(v.x), y: Math.abs(v.y) }),

    magnitude: (v: Vec2): number => Math.sqrt(v.x * v.x + v.y * v.y),

    normalize: (v: Vec2): Vec2 => {
        const mag = Vector2.magnitude(v)
        return mag === 0 ? { x: 0, y: 0 } : { x: v.x / mag, y: v.y / mag }
    },
    distanceSquared: (a: Vec2, b: Vec2): number =>
        (a.x - b.x) ** 2 + (a.y - b.y) ** 2,

    distance: (a: Vec2, b: Vec2): number =>
        Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2),

    // the clockwise, radian angle between the positive x axis with vector 'a' as the origin and the line from vector 'a' to vector 'b'
    angle: (a: Vec2, b: Vec2): number => {
        let diff = Vector2.subtract(b, a);
        return Math.atan2(diff.y, diff.x);
    },

    fromAngle: (t: number): Vec2 => ({ x: Math.cos(t), y: Math.sin(t) }),

    copy: (v: Vec2): Vec2 => {
        return { x: v.x, y: v.y };
    }
}