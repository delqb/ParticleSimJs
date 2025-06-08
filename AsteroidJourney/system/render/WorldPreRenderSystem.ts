import { EntityID, System, Vector2 } from "../../../engine/FluidECS.js";
import { FluidEngine } from "../../../engine/FluidEngine.js";
import { clearCanvas, CONTEXT } from "../../AsteroidJourney.js";
import { PositionComponent, ResolutionComponent, ViewportComponent } from "../../Components.js";

type WorldPreRenderSystemNode = {
    position: PositionComponent;
    resolution: ResolutionComponent;
    viewport: ViewportComponent;
}

export class WorldPreRenderSystem extends System<WorldPreRenderSystemNode> {
    NODE_COMPONENT_KEYS: Set<keyof WorldPreRenderSystemNode> = new Set(['position', 'resolution', 'viewport']);
    constructor(private engineInstance: FluidEngine) {
        super();
    }
    public updateNode(node: WorldPreRenderSystemNode, entityID: EntityID): void {
        const { position, resolution } = node;
        const PPM = this.engineInstance.PIXELS_PER_METER;
        let scaledCanvasRes = Vector2.scale(resolution.resolution, 1 / PPM);
        let scaledCanvasCenter = Vector2.scale(scaledCanvasRes, 1 / 2);
        clearCanvas();
        CONTEXT.save();

        // Scale canvas to convert the unit space from meters to pixels
        CONTEXT.scale(PPM, PPM);

        // Move canvas origin to center of screen (camera pivot point)
        CONTEXT.translate(scaledCanvasCenter.x, scaledCanvasCenter.y);

        // Rotate everything that follows by the inverse of the viewport's rotation
        // This simulates the rotation of the viewport by rotating everything else in the opposite direction
        // Offset the angle by -Math.PI/2 so that the entity's positive x-axis aligns with the screen's/viewport's positive y-axis
        CONTEXT.rotate(-position.rotation - Math.PI / 2);

        let vpCenterPos = Vector2.add(position.position, scaledCanvasCenter);

        // Move world so that player is at the center of the screen
        CONTEXT.translate(-vpCenterPos.x, -vpCenterPos.y);
    }

}