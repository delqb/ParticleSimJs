import { engine } from "../../AsteroidJourney.js";
import { EntityID, MathUtils, System, Vector2 } from "../../../engine/FluidECS.js";
import { PositionComponent, VelocityComponent, AccelerationComponent, MovementControlComponent, TargetPositionComponent } from "../../Components.js";

export type MovementControlSystemNode = {
    position: PositionComponent;
    velocity: VelocityComponent;
    acceleration: AccelerationComponent;
    movementControl: MovementControlComponent;
}

export class MovementControlSystem extends System<MovementControlSystemNode> {
    NODE_COMPONENT_KEYS: Set<keyof MovementControlSystemNode> = new Set(['position', 'velocity', 'acceleration', 'movementControl']);
    public updateNode(node: MovementControlSystemNode, entityID: EntityID) {
        const DELTA_TIME = engine.getDeltaTime();

        // const ANGULAR_VELOCITY_DECAY_FACTOR = 10;
        // node.velocity.angular = MathUtils.lerp(node.velocity.angular, 0, ANGULAR_VELOCITY_DECAY_FACTOR * DELTA_TIME);

        const { acceleration, movementControl: input } = node;
        const { x: iX, y: iY } = input.accelerationInput;
        const rot = node.position.rotation;

        const THRUST_ACCELERATION = 1;
        const ANGULAR_ACCELERATION = 23 / 10;
        const ROLL_ACCELERATION = 3 / 4;

        node.acceleration.angular = ANGULAR_ACCELERATION * node.movementControl.yawInput;

        node.acceleration.acceleration.x = 0;
        node.acceleration.acceleration.y = 0;

        let thrust = -iY;
        if (thrust) {
            node.acceleration.acceleration = Vector2.scale({ x: Math.cos(rot), y: Math.sin(rot) }, thrust * THRUST_ACCELERATION);
        }

        let roll = iX;
        if (roll) {
            let rollVecAngle = rot + roll * Math.PI / 2;
            let rollAccelerationVec = Vector2.scale(Vector2.fromAngle(rollVecAngle), ROLL_ACCELERATION);
            acceleration.acceleration = Vector2.add(acceleration.acceleration, rollAccelerationVec);
        }

        if (node.position.rotation >= 2 * Math.PI)
            node.position.rotation -= 2 * Math.PI;
    }
}