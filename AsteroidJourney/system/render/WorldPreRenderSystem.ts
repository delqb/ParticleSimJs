import { EntityID, System, Vector2 } from "../../../engine/FluidECS.js";
import { FluidEngine } from "../../../engine/FluidEngine.js";
import { clearCanvas, CONTEXT } from "../../AsteroidJourney.js";
import { PositionComponent, ResolutionComponent, TargetPositionComponent, ViewportComponent } from "../../Components.js";

type WorldPreRenderSystemNode = {
    position: PositionComponent;
    targetPosition: TargetPositionComponent;
    resolution: ResolutionComponent;
    viewport: ViewportComponent;
}

export class WorldPreRenderSystem extends System<WorldPreRenderSystemNode> {
    NODE_COMPONENT_KEYS: Set<keyof WorldPreRenderSystemNode> = new Set(['position', 'targetPosition', 'resolution', 'viewport']);
    constructor(private engineInstance: FluidEngine) {
        super();
    }
    public updateNode(node: WorldPreRenderSystemNode, entityID: EntityID): void {
        const { position, targetPosition, resolution } = node;
        const PPM = this.engineInstance.PIXELS_PER_METER;
        let scaledCanvasRes = Vector2.scale(resolution.resolution, 1 / PPM);
        let scaledCanvasCenter = Vector2.scale(scaledCanvasRes, 1 / 2);
        clearCanvas();
        CONTEXT.save();
        CONTEXT.scale(PPM, PPM);
        //Move canvas origin to center of screen (camera pivot point)
        CONTEXT.translate(scaledCanvasCenter.x, scaledCanvasCenter.y);
        //Rotate in the opposite direction of the player
        CONTEXT.rotate(-targetPosition.targetPositionComponent.rotation - Math.PI / 2);
        let vpCenterPos = Vector2.add(position.position, scaledCanvasCenter);
        //Move world so that player is at the center of the screen
        CONTEXT.translate(-vpCenterPos.x, -vpCenterPos.y);
    }

}