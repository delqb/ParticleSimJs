import { ECSEntityId } from "@fluid/core/entity/EntityId";
import { Fluid } from "@fluid/Fluid";

export interface CollisionComponent {
    collidedEntity: ECSEntityId
}

export const Collision = Fluid.defineComponentType<CollisionComponent>("Collision");