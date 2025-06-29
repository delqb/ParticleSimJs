import { ECSNodeSchema } from "@fluid/core/node/schema/NodeSchema";
import { ECSNodeSchemaArchetypeHook } from "@fluid/core/node/schema/NodeSchemaArchetypeHook";
import { ECSNodeSchemaMeta } from "@fluid/core/node/schema/NodeSchemaMeta";
import { ECSNodeSchemaRegistryHook } from "@fluid/core/node/schema/NodeSchemaRegistryHook";
import { HookDispatcher } from "@fluid/core/util/hook/HookDispatcher";
import { FluidArchetype } from "../../archetype/FluidArchetype";
import { FluidArchetypeRegistry } from "../../archetype/FluidArchetypeRegistry";

export class FluidNodeSchemaArchetypeBridge implements ECSNodeSchemaRegistryHook {
    private schemaToArchetypeMap: Map<symbol, FluidArchetype> = new Map(); // Maps each schema symbol to its archetype

    constructor(
        private archetypeRegistry: FluidArchetypeRegistry,
        private schemaArchetypeHooks: HookDispatcher<ECSNodeSchemaArchetypeHook>
    ) {
    }

    private computeArchetypeBitSet(schema: ECSNodeSchema): bigint {
        return FluidArchetype.computeArchetypeBitSet(Object.values(schema));
    }

    /**
     * Retrieves archetype of schema if cached; otherwise, computes and interns the archetype in the archetype registry and then caches it locally.
     */
    getOrCreateArchetype(meta: ECSNodeSchemaMeta): FluidArchetype {
        const idSymbol = meta.id.getSymbol();
        let archetype = this.schemaToArchetypeMap.get(idSymbol);

        // If schema is already mapped to archetype, then no further changes are needed.
        if (archetype) {
            return archetype;
        }

        // Otherwise, compute the archetype bit set and retrieve or register it.
        const bitSet = this.computeArchetypeBitSet(meta.schema);
        // Retrieve the archetype from the registry if it is registered or create and register it
        archetype = this.archetypeRegistry.getOrCreate(bitSet);
        this.schemaToArchetypeMap.set(idSymbol, archetype);
        this.schemaArchetypeHooks.invokeHooks(h => h.onRegisterSchemaArchetype(meta, archetype));
        return archetype;
    }

    removeArchetype(meta: ECSNodeSchemaMeta): void {
        const idSymbol = meta.id.getSymbol();
        const archetype = this.schemaToArchetypeMap.get(idSymbol);

        if (archetype) {
            this.schemaToArchetypeMap.delete(idSymbol);
            this.schemaArchetypeHooks.invokeHooks(h => h.onRemoveSchemaArchetype(meta, archetype));
        }
    }

    onRegisterNodeSchema(meta: ECSNodeSchemaMeta): void {
        this.getOrCreateArchetype(meta);
    }

    onUnregisterNodeSchema(meta: ECSNodeSchemaMeta): void {
        this.removeArchetype(meta);
    }
}