import { ECSEntityId } from ".";
import { ECSArchetype } from "../archetype/Archetype";

export interface ECSEntityArchetypeResolver {
    getArchetypeOfEntity(entityId: ECSEntityId): ECSArchetype;
}