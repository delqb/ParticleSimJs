import { ViewportComponent } from "@asteroid/components/ViewportComponent";
import { ViewportBorderWidthComponent } from "@asteroid/components/ViewportBorderWidthComponent";
import { ResolutionComponent } from "@asteroid/components/ResolutionComponent";
import { EntityID, System } from "@fluidengine/core";

type ViewportRenderNode = {
    resolution: ResolutionComponent;
    borderWidth: ViewportBorderWidthComponent;
    viewport: ViewportComponent;
}

export class ViewportRenderSystem extends System<ViewportRenderNode> {
    NODE_COMPONENT_KEYS: Set<keyof ViewportRenderNode> = new Set(['resolution', 'borderWidth', 'viewport']);
    constructor(public renderContext: CanvasRenderingContext2D) {
        super();
    }
    public updateNode(node: ViewportRenderNode, entityID: EntityID) {
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