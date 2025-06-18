import { Component } from "@fluidengine/core";
import { Vec2, RectSize, Transform, AABB, OBB, Vector2, createTransform } from "@fluidengine/lib/spatial";

export type BoundingBoxComponent = Component & {
    // Center and rotation are computed from position + transform in a system then stored here
    center: Vec2;
    rotation: number;
    size: RectSize;
    transform?: Transform;
    aabb?: AABB;
    obb?: OBB;
}

export function createBoundingBox(size: RectSize, { key = 'boundingBox', center = Vector2.zero(), rotation = 0, transform = createTransform(), aabb = undefined, obb = undefined } = {}): BoundingBoxComponent {
    return { key, center, rotation, size, transform, obb, aabb };
}