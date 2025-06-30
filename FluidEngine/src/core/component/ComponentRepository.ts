import { ECSEntityId } from "../entity/EntityId";
import { ECSComponent } from "./Component";
import { ECSComponentType } from "./type/ComponentType";

export interface ECSComponentRepository {
    hasComponent<T>(componentType: ECSComponentType<T>, entityId: ECSEntityId): boolean;
    getComponent<T>(componentType: ECSComponentType<T>, entityId: ECSEntityId): ECSComponent<T>;
    addComponent<T>(component: ECSComponent<T>, entityId: ECSEntityId): void
    removeComponent<T>(componentType: ECSComponentType<T>, entityId: ECSEntityId): void;

    hasEntity(entityId: ECSEntityId): boolean;
    removeEntityComponents(entiyId: ECSEntityId): void;
    getEntityComponentTypes(entityId: ECSEntityId): Iterable<ECSComponentType<any>>;
    getEntityComponents(entityId: ECSEntityId): Iterable<ECSComponent<any>>;
}