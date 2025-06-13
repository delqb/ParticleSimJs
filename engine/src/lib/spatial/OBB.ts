import { Vec2 } from "./Vector2";

export type OBB = {
    halfExtents: Vec2;      // Half-width and half-height along local axes
    axes: [Vec2, Vec2];     // Local x and y axes (unit vectors), derived from rotation
    corners?: [Vec2, Vec2, Vec2, Vec2];        // Precomputed world-space corners (4 Vec2s)
}