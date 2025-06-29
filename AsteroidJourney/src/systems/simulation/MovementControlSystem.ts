import { MovementControlComponent } from "@asteroid/components/MovementControlComponent";
import { AccelerationComponent } from "@asteroid/components/AccelerationComponent";
import { VelocityComponent } from "@asteroid/components/VelocityComponent";
import { PositionComponent } from "@asteroid/components/PositionComponent";
import { EntityID, System } from "@fluidengine/core";
import { Vector2 } from "@fluidengine/lib/spatial";

const hPI = Math.PI / 2;
const THRUST_FORCE = 1.5

const THRUST_ACCELERATION = THRUST_FORCE;
const ANGULAR_ACCELERATION = THRUST_FORCE * 18 / 10;
const ROLL_ACCELERATION = THRUST_FORCE * 3 / 4;

export type MovementControlSystemNode = {
    position: PositionComponent;
    velocity: VelocityComponent;
    acceleration: AccelerationComponent;
    movementControl: MovementControlComponent;
}

export class MovementControlSystem extends System<MovementControlSystemNode> {
    NODE_COMPONENT_KEYS: Set<keyof MovementControlSystemNode> = new Set(['position', 'velocity', 'acceleration', 'movementControl']);
    public updateNode(node: MovementControlSystemNode, entityID: EntityID) {
        const { acceleration: accelComp, movementControl: input } = node;
        const { x: iX, y: iY } = input.accelerationInput;
        const rot = node.position.rotation;

        accelComp.angular = ANGULAR_ACCELERATION * input.yawInput;

        let accel = { x: 0, y: 0 };

        if (iY) {
            accel.x = iY * THRUST_ACCELERATION * Math.cos(rot);
            accel.y = iY * THRUST_ACCELERATION * Math.sin(rot);
        }

        if (iX) {
            // if roll input is detected
            // add the roll acceleration vector to the current acceleration vector
            // roll acceleration vector direction is 90 degrees left or right of current entity rotation angle
            accel = Vector2.add(accel, Vector2.scale(Vector2.fromAngle(rot + iX * hPI), ROLL_ACCELERATION));
        }

        accelComp.acceleration = accel;
    }
}