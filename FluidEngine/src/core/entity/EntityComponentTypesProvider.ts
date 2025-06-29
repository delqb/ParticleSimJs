import {ECSComponentType} from "../component/type/ComponentType";
import {ECSEntityId} from "./EntityId";

export interface ECSEntityComponentTypesProvider {
    (entityId: ECSEntityId): Iterable<ECSComponentType<any>>;
}