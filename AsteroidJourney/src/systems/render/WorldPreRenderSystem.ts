import { ClientContext } from "@asteroid/client/Client";
import { Viewport } from "@asteroid/components/ViewportComponent";
import { Position } from "@asteroid/components/PositionComponent";
import { Resolution } from "@asteroid/components/ResolutionComponent";
import { Fluid } from "@fluid/Fluid";
import { FluidSystem } from "@fluid/impl/core/system/FluidSystem";
import { ECSNode } from "@fluid/core/node/Node";

const hPI = Math.PI / 2;

const schema = {
    position: Position,
    resolution: Resolution,
    viewport: Viewport
}
type Schema = typeof schema;
const nodeMeta = Fluid.registerNodeSchema(schema, "World Pre Render");

export class WorldPreRenderSystem extends FluidSystem<Schema> {
    constructor(private clientContext: ClientContext) {
        super("World Pre Render System", nodeMeta);
    }

    public updateNode(node: ECSNode<Schema>): void {
        const renderer = this.clientContext.renderer;
        const ctx = renderer.renderContext;
        const PPM = this.clientContext.engineInstance.PIXELS_PER_METER;
        const { position: vpPosComp, resolution: resolutionComponent } = node;
        const vpPos = vpPosComp.position;
        const resolution = resolutionComponent.resolution;
        const hW = resolution.x / (2 * PPM), hH = resolution.y / (2 * PPM);

        renderer.clear();
        ctx.save();

        // Scale canvas to convert the unit space from meters to pixels
        ctx.scale(PPM, PPM);

        // Move canvas origin to center of screen (camera pivot point)
        ctx.translate(hW, hH);

        // Rotate everything that follows by the inverse of the viewport's rotation
        // This simulates the rotation of the viewport by rotating everything else in the opposite direction
        // Offset the angle by -Math.PI/2 so that the entity's positive x-axis aligns with the screen's/viewport's positive y-axis
        ctx.rotate(-vpPosComp.rotation - hPI);

        // Translate everything that follows (world) so that viewport target is at the center of the screen
        ctx.translate(-hW - vpPos.x, -hH - vpPos.y);
    }
}