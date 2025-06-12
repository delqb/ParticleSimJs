import { EntityID, System } from "../../../../engine/FluidECS.js";
import { ClientContext } from "../../../Client.js";
import { BoundingBox, PositionComponent } from "../../../Components.js";

type ColliderRenderSystemNode = {
    position: PositionComponent;
    boundingBox: BoundingBox;
}

export class ColliderRenderSystem extends System<ColliderRenderSystemNode> {
    NODE_COMPONENT_KEYS: Set<keyof ColliderRenderSystemNode> = new Set(['position', 'boundingBox']);
    constructor(public clientContext: ClientContext) {
        super();
    }
    public updateNode(node: ColliderRenderSystemNode, entityID: EntityID): void {
        if (!this.clientContext.displayColliders)
            return;

        const { position: ePos, rotation: eRot } = node.position;
        const { size: rect, transform } = node.boundingBox;
        const ctx = this.clientContext.renderingContext;

        ctx.save();
        // Translate what follows to entity position
        ctx.translate(ePos.x, ePos.y);
        // Rotate what follows to match entity's rotation
        ctx.rotate(eRot);

        // Apply local, collider-specific transformations that are relative to the entity, if any
        if (transform) {
            const { translate: trans, rotate: rot, scale } = transform;
            if (rot) ctx.rotate(rot);
            if (trans) ctx.translate(trans.x, trans.y);
            if (scale) ctx.scale(scale, scale);
        }

        ctx.lineWidth = 1 / this.clientContext.engineInstance.PIXELS_PER_METER;
        ctx.strokeStyle = "white";
        ctx.strokeRect(-rect.width / 2, -rect.height / 2, rect.width, rect.height);

        ctx.restore();
    }

}