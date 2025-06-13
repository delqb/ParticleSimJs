import { PositionComponent, BoundingBox } from "@asteroid/components";
import { System, EntityID } from "@fluidengine/core";
import { Vector2, AABB } from "@fluidengine/lib/spatial";

const fcos = Math.cos, fsin = Math.sin, abs = Math.abs;
const vzero = Vector2.zero;

type BoundingBoxUpdateNode = {
    position: PositionComponent;
    boundingBox: BoundingBox;
}


export class BoundingBoxUpdateSystem extends System<BoundingBoxUpdateNode> {
    NODE_COMPONENT_KEYS: Set<keyof BoundingBoxUpdateNode> = new Set(['position', 'boundingBox']);
    constructor() {
        super();
    }
    public updateNode(node: BoundingBoxUpdateNode, entityID: EntityID): void {
        // Handle all bounding box calculations here and store results in boundingbox component once.
        // In bounding box rendering system, only use the stored values and do not do any transformations.
        // All transformations should already be applied on all the bounding box data this data is to be used in other systems.

        const { position: posComp, boundingBox: bb } = node;
        const { center } = bb;
        const eP = posComp.position;
        const size = bb.size;

        bb.rotation = posComp.rotation
        center.x = eP.x;
        center.y = eP.y;

        const transform = bb.transform;
        if (transform) {
            const scale = transform.scale;
            const rotate = transform.rotate;
            const translate = transform.translate;
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

        const { x, y } = center;
        const rot = bb.rotation;
        const hW = size.width / 2, hH = size.height / 2;
        const cos = fcos(rot), sin = fsin(rot);
        const dX = abs(hW * cos) + abs(hH * sin);
        const dY = abs(hW * sin) + abs(hH * cos);
        const left = x - dX,
            right = x + dX,
            top = y + dY,
            bottom = y - dY;

        const aabb = bb.aabb || {} as AABB;

        aabb.left = left;
        aabb.right = right;
        aabb.top = top;
        aabb.bottom = bottom;

        bb.aabb = aabb;
    }
}