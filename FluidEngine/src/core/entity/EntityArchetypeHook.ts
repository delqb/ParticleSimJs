import { ECSComponentType } from "../component";
import { ECSEntityId } from ".";
import { ECSArchetype } from "../archetype/Archetype";

export interface ECSEntityArchetypeHook {
    onEntityArchetypeExpansion(entityId: ECSEntityId, addedComponentType: ECSComponentType<any>, previousArchetype: ECSArchetype, newArchetype: ECSArchetype): void;
    onEntityArchetypeReduction(entityId: ECSEntityId, removedComponentType: ECSComponentType<any>, previousArchetype: ECSArchetype, newArchetype: ECSArchetype): void;
}