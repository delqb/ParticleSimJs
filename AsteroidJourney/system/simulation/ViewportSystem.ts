import { engine } from "../../AsteroidJourney.js";
import { EntityID, System, Vector2 } from "../../../engine/FluidECS.js";
import { PositionComponent, ResolutionComponent, TargetPositionComponent, CameraSpeedFactorComponent, ViewportComponent } from "../../Components.js";

export type ViewportSystemNode = {
    position: PositionComponent;
    resolution: ResolutionComponent;
    targetPosition: TargetPositionComponent;
    speedFactor: CameraSpeedFactorComponent;
    viewport: ViewportComponent;
}

export class ViewportSystem extends System<ViewportSystemNode> {
    NODE_COMPONENT_KEYS: Set<keyof ViewportSystemNode> = new Set(['position', 'resolution', 'targetPosition', 'speedFactor', 'viewport']);
    public updateNode(node: ViewportSystemNode, entityID: EntityID) {
        const DELTA_TIME = engine.getDeltaTime();
        // const deadzoneWidth = node.deadzone.width / PIXELS_PER_METER;//Deadzone width in world units
        const res = Vector2.scale(node.resolution.resolution, 1 / engine.PIXELS_PER_METER);//Viewport resolution in world units
        const resCenter = Vector2.scale(res, 1 / 2);//Untranslated viewport center in world units
        const centerPos = Vector2.add(node.position.position, resCenter); //World coordinates of viewport center
        // const maxDist = Vector2.subtract(resCenter, { x: deadzoneWidth, y: deadzoneWidth });//Maximum x and y distances from coordinates of viewport center in world
        const diff = Vector2.subtract(node.targetPosition.targetPositionComponent.position, centerPos);
        const dist = Vector2.abs(diff);
        const moveDir = Vector2.normalize(diff);

        if (dist.x > 0 || dist.y > 0) {
            const moveVec = Vector2.multiply(moveDir, dist); // move proportional to how much target exceeded deadzone
            const moveStep = Vector2.scale(moveVec, node.speedFactor.speedFactor * DELTA_TIME);
            node.position.position = Vector2.add(node.position.position, moveStep);
        }
        // Set the viewport rotation equal to the target's
        node.position.rotation = node.targetPosition.targetPositionComponent.rotation;
    }
}