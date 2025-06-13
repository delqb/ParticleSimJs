import { RectSize } from "./RectSize";

export type AABB = {
    top: number;
    bottom: number;
    left: number;
    right: number;
}


export function createAABB(left: number, bottom: number, right: number, top: number): AABB;
export function createAABB(left: number, bottom: number, rectSize: RectSize): AABB;

export function createAABB(
    left: number,
    bottom: number,
    rightOrSize: number | RectSize,
    top?: number
): AABB {
    if (typeof rightOrSize === "number" && typeof top === "number") {
        return {
            left,
            bottom,
            right: rightOrSize,
            top,
        };
    } else if (typeof rightOrSize === "object" && rightOrSize !== null) {
        return {
            left,
            bottom,
            right: left + rightOrSize.width,
            top: bottom + rightOrSize.height,
        };
    } else {
        throw new Error("Invalid arguments passed to createAABB");
    }
}