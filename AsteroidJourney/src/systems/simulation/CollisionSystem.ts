import { PositionComponent, BoundingBoxComponent } from "@asteroid/components";
import { System, EntityID } from "@fluidengine/core";

export type CollisionSystemNode = {
    position: PositionComponent;
    collider: BoundingBoxComponent;
}

export class CollisionSystem extends System<CollisionSystemNode> {
    NODE_COMPONENT_KEYS: Set<keyof CollisionSystemNode> = new Set(['position', 'collider']);
    public updateNode(node: CollisionSystemNode, entityID: EntityID) {

    }
}