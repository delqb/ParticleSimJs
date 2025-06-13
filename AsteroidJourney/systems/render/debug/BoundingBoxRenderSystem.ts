import { ClientContext } from "@asteroid/Client";
import { BoundingBox } from "@asteroid/components";
import { System, EntityID } from "@fluidengine/core";

type BoundingBoxRenderNode = {
    boundingBox: BoundingBox;
}

export class BoundingBoxRenderSystem extends System<BoundingBoxRenderNode> {
    NODE_COMPONENT_KEYS: Set<keyof BoundingBoxRenderNode> = new Set(['boundingBox']);
    constructor(public clientContext: ClientContext) {
        super();
    }
    public updateNode(node: BoundingBoxRenderNode, entityID: EntityID): void {
        const client = this.clientContext;
        const PPM = client.engineInstance.PIXELS_PER_METER;

        if (!client.displayBoundingBoxes)
            return;

        const { boundingBox: bb } = node;
        // const { position: ePos, rotation: eRot } = posComp;
        // const { x, y } = ePos;
        // const { size: rect, transform } = bb;
        const ctx = this.clientContext.renderingContext;

        ctx.save();

        ctx.lineWidth = 1 / PPM;
        ctx.strokeStyle = "white";

        if (bb.aabb) {
            const { top, bottom, left, right } = bb.aabb;
            ctx.strokeRect(left, bottom, right - left, top - bottom);
        }

        if (bb.obb) {

        }

        // // Translate what follows to entity position and apply bounding box translations
        // ctx.translate(x, y);
        // if (transform && transform.translate) ctx.translate(transform.translate.x, transform.translate.y);

        // // Rotate what follows to match entity's rotation to render the oriented bounding box
        // ctx.rotate(eRot);

        // // Apply local, collider-specific transformations that are relative to the entity, if any
        // if (transform) {
        //     if (transform.rotate) ctx.rotate(transform.rotate);
        // }

        // ctx.strokeRect(-rect.width / 2, -rect.height / 2, rect.width, rect.height);

        ctx.restore();
    }

}