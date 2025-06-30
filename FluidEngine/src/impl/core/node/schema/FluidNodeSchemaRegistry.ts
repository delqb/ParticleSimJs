import { ECSNodeSchema } from "@fluid/core/node/schema/NodeSchema";
import { ECSNodeSchemaId } from "@fluid/core/node/schema/NodeSchemaId";
import { ECSNodeSchemaMeta } from "@fluid/core/node/schema/NodeSchemaMeta";
import { ECSNodeSchemaRegistry } from "@fluid/core/node/schema/NodeSchemaRegistry";
import { ECSNodeSchemaRegistryHook } from "@fluid/core/node/schema/NodeSchemaRegistryHook";
import { HookDispatcher } from "@fluid/core/util/hook/HookDispatcher";
import { FluidNodeSchemaId } from "./FluidNodeSchemaId";

export class FluidNodeSchemaRegistry implements ECSNodeSchemaRegistry {
    private schemaMap: Map<symbol, ECSNodeSchemaMeta> = new Map();

    constructor(
        private hooks: HookDispatcher<ECSNodeSchemaRegistryHook>
    ) {
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