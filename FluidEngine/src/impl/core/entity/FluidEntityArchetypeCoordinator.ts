import { ECSArchetype } from "@fluidengine/core/archetype";
import { ECSEntityArchetypeResolver } from "@fluidengine/core/entity/EntityArchetypeResolver";
import { ECSComponent, ECSComponentRepositoryHook, ECSComponentType } from "@fluidengine/core/component";
import { ECSEntityId } from "@fluidengine/core/entity/EntityId";
import { FluidArchetypeRegistry } from "../archetype/FluidArchetypeRegistry";
import { ECSEntityArchetypeHook } from "@fluidengine/core/entity/EntityArchetypeHook";
import { ECSEntityComponentTypesProvider } from "@fluidengine/core/entity/EntityComponentTypesProvider";
import { FluidArchetype } from "../archetype/FluidArchetype";
import { HookDispatcher } from "@fluidengine/core/util/hook/HookDispatcher";

export class FluidEntityArchetypeCoordinator implements ECSEntityArchetypeResolver, ECSComponentRepositoryHook {
    private archetypeMap: Map<symbol, FluidArchetype> = new Map();

    constructor(
        private archetypeRegistry: FluidArchetypeRegistry,
        private getEntityComponentTypes: ECSEntityComponentTypesProvider,
        private entityArchetypeHooks: HookDispatcher<ECSEntityArchetypeHook>
    ) {
    }

    private computeArchetypeBitSet(entityId: ECSEntityId): bigint {
        const componentTypeIterable = this.getEntityComponentTypes(entityId);
        return FluidArchetype.computeArchetypeBitSet(componentTypeIterable);
    }

    getArchetypeOfEntity(entityId: ECSEntityId): ECSArchetype {
        const idSymbol = entityId.getSymbol();

        if (this.archetypeMap.has(idSymbol)) {
            return this.archetypeMap.get(idSymbol);
        }

        const bitSet = this.computeArchetypeBitSet(entityId);
        const archetype = this.archetypeRegistry.getOrCreate(bitSet);
        this.archetypeMap.set(idSymbol, archetype);
        return archetype;
    }

    onAddComponent<T>(componentType: ECSComponentType<T>, component: ECSComponent<T>, entityId: ECSEntityId): void {
        const idSymbol = entityId.getSymbol();

        const currentBitSet: bigint =
            this.archetypeMap.get(idSymbol)?.getBitSet() ??
            this.computeArchetypeBitSet(entityId);
        const currentArchetype = this.archetypeRegistry.getOrCreate(currentBitSet);

        const newBitSet = currentBitSet | FluidArchetype.getBitMask(componentType);
        const newArchetype = this.archetypeRegistry.getOrCreate(newBitSet);

        this.archetypeMap.set(idSymbol, newArchetype);
        this.entityArchetypeHooks.invokeHooks(h => h.onEntityArchetypeExpansion(entityId, componentType, currentArchetype, newArchetype));
    }

    onRemoveComponent<T>(componentType: ECSComponentType<T>, component: ECSComponent<T>, entityId: ECSEntityId): void {
        const idSymbol = entityId.getSymbol();

        const currentBitSet: bigint =
            this.archetypeMap.get(idSymbol)?.getBitSet() ??
            this.computeArchetypeBitSet(entityId);
        const currentArchetype = this.archetypeRegistry.getOrCreate(currentBitSet);

        const newBitSet = currentBitSet & ~FluidArchetype.getBitMask(componentType);
        const newArchetype = this.archetypeRegistry.getOrCreate(newBitSet);

        this.archetypeMap.set(idSymbol, newArchetype);
        this.entityArchetypeHooks.invokeHooks(h => h.onEntityArchetypeReduction(entityId, componentType, currentArchetype, newArchetype));
    }
}