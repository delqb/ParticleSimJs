import {ECSEntityId} from "../entity/EntityId";
import {ECSComponent} from "./Component";
import {ECSComponentType} from "./type/ComponentType";

export interface ECSComponentRepositoryHook {
    onAddComponent<T>(componentType: ECSComponentType<T>, component: ECSComponent<T>, entityId: ECSEntityId): void;
    onRemoveComponent<T>(componentType: ECSComponentType<T>, component: ECSComponent<T>, entityId: ECSEntityId): void;
}