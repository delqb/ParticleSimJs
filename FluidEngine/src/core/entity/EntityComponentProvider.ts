import {ECSComponent} from "../component/Component";
import {ECSComponentType} from "../component/type/ComponentType";
import {ECSEntityId} from "./EntityId";

export interface ECSEntityComponentProvider {
    <T>(componentType: ECSComponentType<T>, entityId: ECSEntityId): ECSComponent<T>;
}