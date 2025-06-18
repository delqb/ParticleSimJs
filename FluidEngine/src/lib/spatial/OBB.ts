import {Vec2, Vector2} from "./Vector2";

export type Axes = {
    x: Vec2;
    y: Vec2;
}

export type OBB = {
    halfExtents: Vec2;      // Half-width and half-height along local axes
    axes: Axes;     // Local x and y axes (unit vectors), derived from rotation
    corners?: [Vec2, Vec2, Vec2, Vec2];        // Precomputed world-space corners (4 Vec2s)
}


export function createOBB({ halfExtents = Vector2.zero(), axes = { x: Vector2.zero(), y: Vector2.zero() }, corners = [Vector2.zero(), Vector2.zero(), Vector2.zero(), Vector2.zero()] } = {}): OBB {
    return { halfExtents, axes, corners } as OBB;
}