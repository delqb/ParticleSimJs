import {ECSEntityId} from "./EntityId";

export interface ECSEntityFactory {
    createEntityId(): ECSEntityId;
}