import { EntityID, System } from "../../../engine/FluidECS.js";
import { ResolutionComponent, ViewportBorderWidthComponent, ViewportComponent } from "../../Components.js";
import { CONTEXT } from "../../AsteroidJourney.js";

type ViewportRenderNode = {
    resolution: ResolutionComponent;
    borderWidth: ViewportBorderWidthComponent;
    viewport: ViewportComponent;
}

export class ViewportRenderSystem extends System<ViewportRenderNode> {
    NODE_COMPONENT_KEYS: Set<keyof ViewportRenderNode> = new Set(['resolution', 'borderWidth', 'viewport']);
    public updateNode(node: ViewportRenderNode, entityID: EntityID) {
        const isActive = true;
        if (!isActive)
            return;

        let borderWidth = node.borderWidth.borderWidth;
        let vWidth = node.resolution.resolution.x,
            vHeight = node.resolution.resolution.y;
        let darkShade = "rgba(0,0,0,1)",
            transparentShade = "rgba(0,0,0,0)";

        let wCS1 = borderWidth / vWidth;
        let grad = CONTEXT.createLinearGradient(0, 0, vWidth, 0);
        grad.addColorStop(0, darkShade);
        grad.addColorStop(wCS1, transparentShade);
        grad.addColorStop(1 - wCS1, transparentShade);
        grad.addColorStop(1, darkShade);

        CONTEXT.fillStyle = grad;
        CONTEXT.fillRect(0, 0, vWidth, vHeight);

        let hCS1 = borderWidth / vHeight;
        grad = CONTEXT.createLinearGradient(0, 0, 0, vHeight);
        grad.addColorStop(0, darkShade);
        grad.addColorStop(hCS1, transparentShade);
        grad.addColorStop(1 - hCS1, transparentShade);
        grad.addColorStop(1, darkShade);

        CONTEXT.fillStyle = grad;
        CONTEXT.fillRect(0, 0, vWidth, vHeight);
    }
}