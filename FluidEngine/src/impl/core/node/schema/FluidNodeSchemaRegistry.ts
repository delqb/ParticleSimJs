import { ECSNodeSchemaRegistry } from "@fluidengine/core/node";
import { ECSNodeSchema } from "@fluidengine/core/node/schema/NodeSchema";
import { ECSNodeSchemaId } from "@fluidengine/core/node/schema/NodeSchemaId";
import { ECSNodeSchemaMeta } from "@fluidengine/core/node/schema/NodeSchemaMeta";
import { FluidNodeSchemaId } from "./FluidNodeSchemaId";
import { ECSNodeSchemaRegistryHook } from "@fluidengine/core/node/schema/NodeSchemaRegistryHook";
import { HookDispatcher } from "@fluidengine/core/util/hook/HookDispatcher";

export class FluidNodeSchemaRegistry implements ECSNodeSchemaRegistry {
    private schemaMap: Map<symbol, ECSNodeSchemaMeta> = new Map();

    constructor(
        private hooks: HookDispatcher<ECSNodeSchemaRegistryHook>
    ) {
        throw new Error("FluidNodeSchemaRegistry not fully implemented.");
    }

    hasSchema(schemaId: ECSNodeSchemaId): boolean {
        return this.schemaMap.has(schemaId.getSymbol());
    }

    getSchemaBySymbol(idSymbol: symbol): ECSNodeSchemaMeta {
        const meta = this.schemaMap.get(idSymbol);
        if (!meta)
            throw new Error(`Could not find schema using symbol.`);
        return meta;
    }

    getSchema(schemaId: ECSNodeSchemaId): ECSNodeSchemaMeta {
        const idSymbol = schemaId.getSymbol();
        const meta = this.schemaMap.get(idSymbol);
        if (!meta)
            throw new Error(`Could not find schema '${schemaId.getName()}'`);
        return meta;
    }

    addSchema(schema: ECSNodeSchema, name: string): ECSNodeSchemaMeta {
        const id = new FluidNodeSchemaId(name);
        const meta: ECSNodeSchemaMeta = { id, schema };
        this.schemaMap.set(id.getSymbol(), meta);

        this.hooks.invokeHooks(h => h.onRegisterNodeSchema(meta));
        return meta;
    }

    removeSchema(schemaId: ECSNodeSchemaId): void {
        const idSymbol = schemaId.getSymbol();
        const meta = this.schemaMap.get(idSymbol);

        if (!meta)
            throw new Error(`Could not remove schema '${schemaId.getName()}'`);

        this.schemaMap.delete(idSymbol);

        this.hooks.invokeHooks(h => h.onUnregisterNodeSchema(meta));
    }


}