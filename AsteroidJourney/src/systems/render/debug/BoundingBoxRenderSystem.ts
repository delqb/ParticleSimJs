import {ClientContext} from "@asteroid/client/Client";
import {BoundingBoxComponent} from "@asteroid/components";
import {EntityID, System} from "@fluidengine/core";

const PI = Math.PI;

type BoundingBoxRenderNode = {
    boundingBox: BoundingBoxComponent;
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
        const { width, height } = bb.size;
        const ctx = this.clientContext.renderer.renderContext;
        ctx.save();

        ctx.lineWidth = 1 / PPM;
        ctx.strokeStyle = "white";

        const aabb = bb.aabb;
        if (aabb) {
            const { maxY, minY, minX, maxX } = aabb;
            ctx.strokeRect(minX, minY, maxX - minX, maxY - minY);
        }

        const obb = bb.obb;
        if (obb && obb.corners) {
            const corners = obb.corners;
            ctx.beginPath();
            let corner = corners[0];
            ctx.moveTo(corner.x, corner.y);
            for (let i = 1; i < 4; i++) {
                corner = corners[i];
                ctx.lineTo(corner.x, corner.y);
            }
            ctx.closePath();
            ctx.stroke();
        }

        ctx.fillStyle = "white";
        ctx.beginPath();
        const centerPointWidth = Math.min(width, height) / 20;
        const hcpw = centerPointWidth / 2;
        const ctr = bb.center;
        ctx.arc(ctr.x, ctr.y, hcpw, 0, 2 * PI);
        ctx.fill();

        ctx.fillStyle = "yellow";
        ctx.beginPath();
        ctx.arc(bb.aabb.maxX, ctr.y, hcpw, 0, 2 * PI);
        ctx.fill();

        ctx.fillStyle = "green";
        ctx.beginPath();
        ctx.arc(ctr.x, bb.aabb.maxY, hcpw, 0, 2 * PI);
        ctx.fill();

        ctx.restore();
    }

}