import {Vec2} from "./Vector2";

export type ConvexPolygon = Vec2[];// must be in counter-clockwise or clockwise order

const reference_axis: Vec2 = { x: Math.SQRT1_2, y: Math.SQRT1_2 };

/** 
 * This function implements the **Separating Axis Theorem** (SAT) to detect collisions between two convex polygons.
 * 
 * Edge vectors are computed from each polygon's vertices. Then, their unit normal vectors are calculated and used as potential separating axes.
 * Each polygon is projected onto these axes, and the minimum and maximum values of their projections are checked for overlap.
 * - If projections on any axis do not overlap, the function exits early and returns `true`, indicating a separating axis exists.
 * - If all axes are tested without finding a separating axis, the function returns `false`, meaning the polygons are intersecting.
 * 
 * This function also computes the dot product between each polygon's unit normal and a fixed reference axis (`reference_axis`).
 * The dot product is then quantized to a level of precision determined by the `quantization_precision` parameter, and the result is cached in a set.
 * The caching mechanism helps avoid redundant checks for axes that have already been tested, optimizing performance.
 * 
 * @param polygonA A 'ConvexPolygon' array of vectors, ordered either counter-clockwise or clockwise.
 * @param polygonB A 'ConvexPolygon' array of vectors, ordered either counter-clockwise or clockwise.
 * @param quantization_precision The precision used to quantize the dot product between each polygon's unit normal and the reference axis.
 *                             A higher value (e.g., 1e6) results in finer precision, while a lower value reduces precision and can 
 *                             improve performance by skipping projection checks for nearly identical axes. This parameter optimizes 
 *                             the algorithm by caching previously tested axes.
 * 
 * @returns `true` if a separating axis is found, indicating no overlap between the polygons.
 *          `false` if no separating axis is found, indicating the polygons intersect.
 */
export function isSeparatingAxisExistent(polygonA: ConvexPolygon, polygonB: ConvexPolygon, quantization_precision = 1e6): boolean {
    const seen: Set<number> = new Set();

    for (const vertices of [polygonA, polygonB]) {
        for (let i = 0; i < vertices.length; i++) {
            const current = vertices[i];
            const next = vertices[(i + 1) % vertices.length];

            // Edge vector
            const edgeX = next.x - current.x,
                edgeY = next.y - current.y;
            const edgeLength = Math.hypot(edgeX, edgeY);

            // Normalized perpendicular axis
            const unitNormX = -edgeY / edgeLength,
                unitNormY = edgeX / edgeLength;
            // Compute dot product with refere axis
            const dot = unitNormX * reference_axis.x + unitNormY * reference_axis.y;
            // Quantize dot product
            const quantized = Math.round(Math.abs(dot) * quantization_precision);

            // Cache quantized dot product to skip similar axis projection checks.
            if (seen.has(quantized)) continue;
            seen.add(quantized);

            // Project both polygons onto the axis
            const [minA, maxA] = projectPolygonOntoAxis(polygonA, unitNormX, unitNormY);
            const [minB, maxB] = projectPolygonOntoAxis(polygonB, unitNormX, unitNormY);

            // Check for separation
            if (maxA < minB || maxB < minA) {
                // Separating axis found
                return true;
            }
        }
    }

    // No separating axis found → polygons intersect
    return false;
}

/** 
 * Projects a convex polygon onto a specified axis and returns the minimum and maximum projection values.
 * The projection is computed by taking the dot product of each vertex with the given axis.
 * 
 * @param polygon A 'ConvexPolygon' array of vectors representing the polygon's vertices.
 * @param axisX The X component of the axis onto which the polygon is projected.
 * @param axisY The Y component of the axis onto which the polygon is projected.
 * 
 * @returns A tuple [min, max] where `min` is the smallest projection value and `max` is the largest projection value.
 */
export function projectPolygonOntoAxis(polygon: ConvexPolygon, axisX: number, axisY: number): [number, number] {
    let min = Infinity, max = -Infinity;
    for (const v of polygon) {
        const proj = v.x * axisX + v.y * axisY;
        if (proj < min) min = proj;
        if (proj > max) max = proj;
    }
    return [min, max];
}