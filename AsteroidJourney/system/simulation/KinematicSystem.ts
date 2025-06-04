import { engine } from "../../AsteroidJourney.js";
import { EntityID, System } from "../../../engine/FluidECS.js";
import { PositionComponent, VelocityComponent, AccelerationComponent } from "../../Components.js";

export type KinematicSystemNode = {
    position: PositionComponent;
    velocity: VelocityComponent;
    acceleration: AccelerationComponent;
}

export class KinematicSystem extends System<KinematicSystemNode> {
    NODE_COMPONENT_KEYS: Set<keyof KinematicSystemNode> = new Set(['position', 'acceleration', 'velocity']);
    public updateNode(node: KinematicSystemNode, entityID: EntityID) {
        const DELTA_TIME = engine.getDeltaTime();
        const { velocity, acceleration } = node;
        let { x: vX, y: vY } = velocity.velocity;

        // Apply acceleration
        vX += acceleration.acceleration.x * DELTA_TIME;
        vY += acceleration.acceleration.y * DELTA_TIME;
        let speed = Math.sqrt(vX ** 2 + vY ** 2);

        velocity.velocity.x = vX;
        velocity.velocity.y = vY;
        velocity.angular += acceleration.angular * DELTA_TIME;
    }
}