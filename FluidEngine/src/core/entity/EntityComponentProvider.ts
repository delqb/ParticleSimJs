import { ECSComponent, ECSComponentType } from "@fluidengine/core/component";
import { ECSEntityId } from "@fluidengine/core/entity/EntityId";

export interface ECSEntityComponentProvider {
    <T>(componentType: ECSComponentType<T>, entityId: ECSEntityId): ECSComponent<T>;
}