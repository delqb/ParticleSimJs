import {ECSArchetype} from "../archetype/Archetype";
import {ECSEntityId} from "./EntityId";

export interface ECSEntityArchetypeResolver {
    getArchetypeOfEntity(entityId: ECSEntityId): ECSArchetype;
}