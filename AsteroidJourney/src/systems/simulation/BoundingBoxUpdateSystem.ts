import { BoundingBox } from "@asteroid/components/BoundingBoxComponent";
import { Position } from "@asteroid/components/PositionComponent";
import { ECSNode } from "@fluid/core/node/Node";
import { Fluid } from "@fluid/Fluid";
import { FluidSystem } from "@fluid/impl/core/system/FluidSystem";
import { AABB } from "@fluid/lib/spatial/AABB";
import { createOBB } from "@fluid/lib/spatial/OBB";

const fcos = Math.cos, fsin = Math.sin, abs = Math.abs;

const schema = {
    position: Position,
    boundingBox: BoundingBox
}
type Schema = typeof schema;
const nodeMeta = Fluid.registerNodeSchema(schema, "Bounding Box Update");

export class BoundingBoxUpdateSystem extends FluidSystem<Schema> {
    constructor() { super("Bounding Box Update System", nodeMeta); }

    public updateNode(node: ECSNode<Schema>): void {
        // Handle all bounding box calculations here and store results in boundingbox component once.
        // In bounding box rendering system, only use the stored values and do not do any transformations.
        // All transformations should already be applied on all the bounding box data this data is to be used in other systems.

        const { position: posComp, boundingBox: bb } = node;
        const { center } = bb;
        const eP = posComp.position;
        const size = bb.size;

        // Apply transform (mutating size and center)
        bb.rotation = posComp.rotation;
        center.x = eP.x;
        center.y = eP.y;

        const transform = bb.transform;
        if (transform) {
            const { scale, rotate, translate } = transform;
            if (scale) {
                // Bake the scale into rectSize and reset;
                size.width *= scale;
                size.height *= scale;
                transform.scale = undefined;
            }
            if (rotate) {
                bb.rotation += rotate;
            }
            if (translate) {
                center.x += translate.x;
                center.y += translate.y;
            }
        }

        const { x: cx, y: cy } = center;
        const rot = bb.rotation;
        const cos = fcos(rot), sin = fsin(rot);
        const hw = size.width / 2, hh = size.height / 2;

        //Compute AABB from rotated box
        const dX = abs(hw * cos) + abs(hh * sin);
        const dY = abs(hw * sin) + abs(hh * cos);

        const aabb = bb.aabb || {} as AABB;
        aabb.minX = cx - dX;
        aabb.maxX = cx + dX;
        aabb.maxY = cy + dY;
        aabb.minY = cy - dY;
        bb.aabb = aabb;

        // Compute OBB axes and half-extents
        const axisX = { x: cos, y: sin };        // Local X axis
        const axisY = { x: -sin, y: cos };       // Local Y axis

        const obb = bb.obb || createOBB();

        obb.halfExtents.x = hw;
        obb.halfExtents.y = hh;
        obb.axes.x = axisX;
        obb.axes.y = axisY;

        // Offset combinations for 4 corners
        const dx = [hw, hw, -hw, -hw];
        const dy = [hh, -hh, -hh, hh];

        for (let i = 0; i < 4; i++) {
            const offsetX = dx[i] * axisX.x + dy[i] * axisY.x;
            const offsetY = dx[i] * axisX.y + dy[i] * axisY.y;
            obb.corners[i].x = cx + offsetX;
            obb.corners[i].y = cy + offsetY;
        }

        bb.obb = obb;
    }
}
