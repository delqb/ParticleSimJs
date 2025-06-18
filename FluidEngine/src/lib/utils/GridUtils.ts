import {Axes, Vec2} from "../spatial";
import {encodeIntegerPair} from "./MathUtils";

const ceil = Math.ceil, floor = Math.floor;

export type IndexCollector = {
    (i: number, j: number): void;
}

/**
 * Performs a conservative rasterization of an oriented bounding box (OBB) over a grid.
 *
 * Samples points across the interior of the OBB and maps them to grid cell indices,
 * invoking a callback for each unique cell intersected. Projection factors extend
 * the rasterized area to mitigate undercoverage.
 * 
 * This function is accurately represented in the following Desmos graph:
 * https://www.desmos.com/calculator/f4o93uvlpc
 * The graph offers an interactive visualization of the OBB, projected dimensions, axes, and cell index computations.
 * It highlights selected grid cells and exposes intermediate values to support intuitive understanding and precise parameter tuning.
 *
 * @param rectWidth Width of the OBB (in world units).
 * @param rectHeight Height of the OBB (in world units).
 * @param cellSize Size of each grid cell.
 * @param widthProjectionFactor Scalar multiplier to widen the OBB along its local width axis.
 * @param heightProjectionFactor Scalar multiplier to widen the OBB along its local height axis.
 * @param axes The local orientation vectors (x and y) of the OBB.
 * @param center The center position of the OBB in world space.
 * @param scanResolution Scalar factor that modulates the number of sampling steps per axis; higher values result in finer subdivisions and improved coverage accuracy at increased computational cost.
 * @param collect Callback invoked with each (i, j) grid cell index covered by the OBB.
 */
export function conservativeOBBRasterization(rectWidth: number, rectHeight: number, cellSize: number, widthProjectionFactor: number, heightProjectionFactor: number, axes: Axes, center: Vec2, scanResolution: number, collect: IndexCollector): void {
    // Here is a model of this function in desmos graphing calculator:
    if (rectWidth <= 0 || rectHeight <= 0 || cellSize <= 0)
        throw new Error(`Invalid grid scan parameters: found zero or negative values.`);
    // Extend the width and height by the projection factors to encompass more cells for an over-inclusive scan.
    // This helps compensate for the cells that would otherwise be missed when the covered area of a cell is very small.
    // For large rectangles, smaller factors are often sufficient due to their naturally broader spatial coverage.
    const rw = rectWidth * widthProjectionFactor,
        rh = rectHeight * heightProjectionFactor;
    const hw = rw / 2,
        hh = rh / 2;

    // The number of steps along each axis based on the rectangle extents and the cell size.
    // The greater the resolution, the more precise the scan will be (at a much greater computational cost)
    const nXStep = ceil(rw / cellSize) * scanResolution,
        nYStep = ceil(rh / cellSize) * scanResolution;
    // The length traversed with every step along each axis.
    const xStep = rw / nXStep,
        yStep = rh / nYStep;

    const cx = center.x,
        cy = center.y;

    const ax = axes.x,
        ay = axes.y

    const axx = ax.x,
        axy = ax.y,
        ayx = ay.x,
        ayy = ay.y


    const seen = new Set<number>();
    // iterate the 'local' x and y values and transform them using the center and the axis vectors
    for (let i = 0; i <= nXStep; i++) {
        for (let j = 0; j <= nYStep; j++) {
            const lx = -hw + i * xStep,
                ly = -hh + j * yStep;

            const x = cx + lx * axx + ly * ayx,
                y = cy + lx * axy + ly * ayy;

            // Map the world-space sample point to its corresponding grid cell index (not world position) by dividing and flooring.
            // This index is used for hashing/deduplication and later conversion to cell position if needed (by multiplying by cell size).
            const cellIdxX = floor(x / cellSize),
                cellIdxY = floor(y / cellSize);

            const enc = encodeIntegerPair(cellIdxX, cellIdxY);
            if (seen.has(enc))
                continue;

            seen.add(enc);
            collect(cellIdxX, cellIdxY);
        }
    }
}