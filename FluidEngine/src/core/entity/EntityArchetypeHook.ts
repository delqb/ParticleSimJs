import {ECSArchetype} from "@fluidcore/archetype/Archetype";
import {ECSComponentType} from "@fluidcore/component/type/ComponentType";
import {ECSEntityId} from "@fluidcore/entity/EntityId";

export interface ECSEntityArchetypeHook {
    onEntityArchetypeExpansion(entityId: ECSEntityId, addedComponentType: ECSComponentType<any>, previousArchetype: ECSArchetype, newArchetype: ECSArchetype): void;
    onEntityArchetypeReduction(entityId: ECSEntityId, removedComponentType: ECSComponentType<any>, previousArchetype: ECSArchetype, newArchetype: ECSArchetype): void;
}