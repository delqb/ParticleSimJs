import { EntityID, MathUtils, System } from "../../../engine/FluidECS.js";
import { PositionComponent, VelocityComponent, AccelerationComponent } from "../../Components.js";
import { ClientContext } from "../../Client.js";

export type KinematicSystemNode = {
    position: PositionComponent;
    velocity: VelocityComponent;
    acceleration: AccelerationComponent;
}

export class KinematicSystem extends System<KinematicSystemNode> {
    NODE_COMPONENT_KEYS: Set<keyof KinematicSystemNode> = new Set(['position', 'acceleration', 'velocity']);
    constructor(public clientContext: ClientContext) {
        super();
    }
    public updateNode(node: KinematicSystemNode, entityID: EntityID) {
        const DELTA_TIME = this.clientContext.engineInstance.getDeltaTime();
        const { velocity: velocityComp, acceleration: accelerationComp, position } = node;
        const a = accelerationComp.acceleration,
            v = velocityComp.velocity;

        v.x += a.x * DELTA_TIME;
        v.y += a.y * DELTA_TIME;
        velocityComp.angular += accelerationComp.angular * DELTA_TIME;
    }
}