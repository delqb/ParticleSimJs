import { engine } from "../../AsteroidJourney.js";
import { EntityID, System } from "../../../engine/FluidECS.js";
import { PositionComponent, VelocityComponent, ParticleComponent, BoundingBox } from "../../Components.js";

export type CollisionSystemNode = {
    position: PositionComponent;
    collider: BoundingBox;
}

export class CollisionSystem extends System<CollisionSystemNode> {
    NODE_COMPONENT_KEYS: Set<keyof CollisionSystemNode> = new Set(['position', 'collider']);
    public updateNode(node: CollisionSystemNode, entityID: EntityID) {

    }
}