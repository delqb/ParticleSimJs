import { engine } from "../../AsteroidJourney.js";
import { EntityID, System, MathUtils } from "../../../engine/FluidECS.js";
import { PositionComponent, VelocityComponent } from "../../Components.js";

export type PositionSystemNode = {
    position: PositionComponent;
    velocity: VelocityComponent;
}

export class PositionSystem extends System<PositionSystemNode> {
    NODE_COMPONENT_KEYS: Set<keyof PositionSystemNode> = new Set(['position', 'velocity']);
    public updateNode(node: PositionSystemNode, entityID: EntityID) {
        const DELTA_TIME = engine.getDeltaTime();
        node.position.position.x += node.velocity.velocity.x * DELTA_TIME;
        node.position.position.y += node.velocity.velocity.y * DELTA_TIME;
        node.position.rotation += node.velocity.angular * DELTA_TIME;

        const ANGULAR_VELOCITY_DECAY_FACTOR = 10;
        node.velocity.angular = MathUtils.lerp(node.velocity.angular, 0, ANGULAR_VELOCITY_DECAY_FACTOR * DELTA_TIME);
    }
}