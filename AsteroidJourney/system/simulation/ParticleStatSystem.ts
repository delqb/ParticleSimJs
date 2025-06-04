import { EntityID, System, Vector2 } from "../../../engine/FluidECS.js";
import { ParticleStatsComponent } from "../../Components.js";

export type ParticleStatSystemNode = {
    particleStats: ParticleStatsComponent;
}

export class ParticleStatSystem extends System<ParticleStatSystemNode> {
    NODE_COMPONENT_KEYS: Set<keyof ParticleStatSystemNode> = new Set(['particleStats']);
    public updateNode(node: ParticleStatSystemNode, entityID: EntityID) {
        let stats = node.particleStats;
        stats.computedSpeed = Vector2.magnitude(stats.velocity);
        stats.computedAcceleration = Vector2.magnitude(stats.acceleration);
    }
}