import { ECSEntityFactory } from "./EntityFactory";
import { ECSEntityId } from "./EntityId";
import { ECSEntityProxy } from "./EntityProxy";

export interface ECSEntityManager {
    getEntities(): Iterable<ECSEntityId>;

    hasEntity(entityId: ECSEntityId): boolean;
    removeEntity(entityId: ECSEntityId): void;
    addEntity(entityId: ECSEntityId): void;

    createEntity(): ECSEntityId;

    getEntityProxy(entityId: ECSEntityId): ECSEntityProxy;
}