import { RectSize } from "./RectSize";

export type AABB = {
    maxY: number;
    minY: number;
    minX: number;
    maxX: number;
}


export function createAABB(left: number, bottom: number, right: number, top: number): AABB;
export function createAABB(left: number, bottom: number, rectSize: RectSize): AABB;

export function createAABB(
    minX: number,
    maxY: number,
    maxXOrSize: number | RectSize,
    minY?: number
): AABB {
    if (typeof maxXOrSize === "number" && typeof minY === "number") {
        return {
            minX: minX,
            minY: maxY,
            maxX: maxXOrSize,
            maxY: minY,
        };
    } else if (typeof maxXOrSize === "object" && maxXOrSize !== null) {
        return {
            minX: minX,
            minY: maxY,
            maxX: minX + maxXOrSize.width,
            maxY: maxY + maxXOrSize.height,
        };
    } else {
        throw new Error("Invalid arguments passed to createAABB");
    }
}

export function aabbsIntersect(a: AABB, b: AABB): boolean {
    return (
        a.minX <= b.maxX &&
        a.maxX >= b.minX &&
        a.maxY >= b.minY &&
        a.minY <= b.maxY
    );
}