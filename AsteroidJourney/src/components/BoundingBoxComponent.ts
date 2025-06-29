import { Fluid } from "@fluid/Fluid";
import { AABB } from "@fluid/lib/spatial/AABB";
import { OBB } from "@fluid/lib/spatial/OBB";
import { RectSize } from "@fluid/lib/spatial/RectSize";
import { Transform, createTransform } from "@fluid/lib/spatial/Transform";
import { Vec2, Vector2 } from "@fluid/lib/spatial/Vector2";

export interface BoundingBoxComponent {
    // Center and rotation are computed from position + transform in a system then stored here
    center: Vec2;
    rotation: number;
    size: RectSize;
    transform?: Transform;
    aabb?: AABB;
    obb?: OBB;
}

export const BoundingBox = Fluid.defineComponentType<BoundingBoxComponent>("BoundingBox");

export function createBoundingBox(size: RectSize, { center = Vector2.zero(), rotation = 0, transform = createTransform(), aabb = undefined, obb = undefined } = {}): BoundingBoxComponent {
    return { center, rotation, size, transform, obb, aabb };
}