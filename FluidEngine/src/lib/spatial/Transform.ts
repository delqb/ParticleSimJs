import {Vec2} from "./Vector2";

export type Transform = {
    translate?: Vec2;
    rotate?: number;
    scale?: number;
}

export function createTransform({ translate = undefined, rotate = undefined, scale = undefined } = {}): Transform {
    return { translate, scale, rotate } as Transform;
}