import { ECSArchetype } from "@fluid/core/archetype/Archetype";
import { ECSComponent } from "@fluid/core/component/Component";
import { ECSComponentRepositoryHook } from "@fluid/core/component/ComponentRepositoryHook";
import { ECSComponentType } from "@fluid/core/component/type/ComponentType";
import { ECSEntityArchetypeHook } from "@fluid/core/entity/EntityArchetypeHook";
import { ECSEntityArchetypeResolver } from "@fluid/core/entity/EntityArchetypeResolver";
import { ECSEntityComponentTypesProvider } from "@fluid/core/entity/EntityComponentTypesProvider";
import { ECSEntityId } from "@fluid/core/entity/EntityId";
import { HookDispatcher } from "@fluid/core/util/hook/HookDispatcher";
import { FluidArchetype } from "../archetype/FluidArchetype";
import { FluidArchetypeRegistry } from "../archetype/FluidArchetypeRegistry";

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