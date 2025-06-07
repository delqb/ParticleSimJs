import { EntityID, System, Vector2 } from "../../../engine/FluidECS.js";
import { AccelerationComponent, StatsComponent, VelocityComponent } from "../../Components.js";

export type StatSystemNode = {
    velocity: VelocityComponent;
    acceleration: AccelerationComponent;
    stats: StatsComponent;
}

export class StatSystem extends System<StatSystemNode> {
    NODE_COMPONENT_KEYS: Set<keyof StatSystemNode> = new Set(['stats', 'velocity', 'acceleration']);
    public updateNode(node: StatSystemNode, entityID: EntityID) {
        const { stats: stats, velocity, acceleration } = node;
        stats.computedSpeed = Vector2.magnitude(velocity.velocity);
        stats.computedAcceleration = Vector2.magnitude(acceleration.acceleration);
    }
}