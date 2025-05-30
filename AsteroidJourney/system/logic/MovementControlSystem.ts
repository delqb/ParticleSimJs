import { engine } from "../../AsteroidJourney.js";
import { EntityID, System, Vector2 } from "../../../engine/FluidECS.js";
import { PositionComponent, VelocityComponent, AccelerationComponent, MovementControlComponent, TargetPositionComponent } from "../../Components.js";

export type MovementControlSystemNode = {
    position: PositionComponent;
    velocity: VelocityComponent;
    acceleration: AccelerationComponent;
    movementControl: MovementControlComponent;
    targetPosition: TargetPositionComponent;
}

export class MovementControlSystem extends System<MovementControlSystemNode> {
    NODE_COMPONENT_KEYS: Set<keyof MovementControlSystemNode> = new Set(['position', 'velocity', 'acceleration', 'movementControl', 'targetPosition']);
    public updateNode(node: MovementControlSystemNode, entityID: EntityID) {
        const DELTA_TIME = engine.getDeltaTime();
        const { acceleration, movementControl: input } = node;
        const { x: iX, y: iY } = input.acceleration;
        const rot = node.position.rotation;

        const THRUST_ACCELERATION = 1;
        const ANGULAR_ACCELERATION = 23;
        const ROLL_ACCELERATION = 1 / 4;


        let vAngular = node.velocity.angular;
        if (node.movementControl.yawControl) {
            let angleWithTarget = Vector2.angle(node.position.position, node.targetPosition.targetPosition);
            let rot = node.position.rotation;
            let diff = angleWithTarget - rot;
            let pi = Math.PI
            vAngular += DELTA_TIME * ANGULAR_ACCELERATION * (((diff + pi) % (2 * pi) + 2 * pi) % (2 * pi) - pi);
        }


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
        node.velocity.angular = vAngular;
    }
}