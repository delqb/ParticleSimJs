import { ECSComponent, ECSComponentType } from "../component";
import { ECSEntityId } from "./EntityId";

export interface ECSEntityComponentTypesProvider {
    (entityId: ECSEntityId): Iterable<ECSComponentType<any>>;
}