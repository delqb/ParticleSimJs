import { Viewport } from "@asteroid/components/ViewportComponent";
import { ViewportBorderWidth } from "@asteroid/components/ViewportBorderWidthComponent";
import { Resolution } from "@asteroid/components/ResolutionComponent";
import { Fluid } from "@fluid/Fluid";
import { FluidSystem } from "@fluid/impl/core/system/FluidSystem";
import { ECSNode } from "@fluid/core/node/Node";

const schema = {
    resolution: Resolution,
    borderWidth: ViewportBorderWidth,
    viewport: Viewport
}
type Schema = typeof schema;
const nodeMeta = Fluid.registerNodeSchema(schema, "Viewport Render");

export class ViewportRenderSystem extends FluidSystem<Schema> {
    constructor(public renderContext: CanvasRenderingContext2D) {
        super("Viewport Render System", nodeMeta);
    }

    public updateNode(node: ECSNode<Schema>) {
        const ctx = this.renderContext;
        const isActive = true;
        if (!isActive)
            return;

        let borderWidth = node.borderWidth.borderWidth;
        let vWidth = node.resolution.resolution.x,
            vHeight = node.resolution.resolution.y;
        let darkShade = "rgba(0,0,0,1)",
            transparentShade = "rgba(0,0,0,0)";

        let wCS1 = borderWidth / vWidth;
        let grad = ctx.createLinearGradient(0, 0, vWidth, 0);
        grad.addColorStop(0, darkShade);
        grad.addColorStop(wCS1, transparentShade);
        grad.addColorStop(1 - wCS1, transparentShade);
        grad.addColorStop(1, darkShade);

        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, vWidth, vHeight);

        let hCS1 = borderWidth / vHeight;
        grad = ctx.createLinearGradient(0, 0, 0, vHeight);
        grad.addColorStop(0, darkShade);
        grad.addColorStop(hCS1, transparentShade);
        grad.addColorStop(1 - hCS1, transparentShade);
        grad.addColorStop(1, darkShade);

        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, vWidth, vHeight);
    }
}