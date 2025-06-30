import { ClientContext } from "@asteroid/client/Client";
import { Acceleration } from "@asteroid/components/AccelerationComponent";
import { Velocity } from "@asteroid/components/VelocityComponent";
import { Position } from "@asteroid/components/PositionComponent";
import { Fluid } from "@fluid/Fluid";
import { FluidSystem } from "@fluid/impl/core/system/FluidSystem";
import { ECSNode } from "@fluid/core/node/Node";

const schema = {
    position: Position,
    velocity: Velocity,
    acceleration: Acceleration
}
type Schema = typeof schema;
const nodeMeta = Fluid.registerNodeSchema(schema, "Kinematic");

export class KinematicSystem extends FluidSystem<Schema> {
    constructor(public clientContext: ClientContext) {
        super("Kinematic System", nodeMeta);
    }
    public updateNode(node: ECSNode<Schema>): void {
        const DELTA_TIME = this.clientContext.engineInstance.getDeltaTime();
        const { velocity: velocityComp, acceleration: accelerationComp } = node;
        const a = accelerationComp.acceleration,
            v = velocityComp.velocity;

        v.x += a.x * DELTA_TIME;
        v.y += a.y * DELTA_TIME;
        velocityComp.angular += accelerationComp.angular * DELTA_TIME;
    }
}