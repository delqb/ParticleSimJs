import { ECSArchetype } from "@fluidengine/core/archetype";
import { ECSComponent, ECSComponentType } from "@fluidengine/core/component";
import { ECSNodeSchemaIndex } from "@fluidengine/core/node/schema/NodeSchemaIndex";
import { ECSNodeSchemaMeta } from "@fluidengine/core/node/schema/NodeSchemaMeta";
import { ECSNodeSchemaRegistryHook } from "@fluidengine/core/node/schema/NodeSchemaRegistryHook";
import { FluidArchetype } from "../../archetype/FluidArchetype";
import { ECSNodeSchemaResolver } from "@fluidengine/core/node/schema/NodeSchemaResolver";
import { getLazyMappedIterable } from "@fluidengine/lib/utils/LazyIterableMap";

export class FluidNodeSchemaIndex implements ECSNodeSchemaIndex, ECSNodeSchemaRegistryHook {
    private archetypeToSchemaMap: Map<bigint, Set<symbol>> = new Map();
    private componentTypeToSchemasMap: Map<symbol, Set<symbol>> = new Map();

    private static readonly EMPTY_SET: Set<any> = Object.freeze(new Set());

    constructor(
        private getSchemaBySymbol: ECSNodeSchemaResolver,
        private getArchetypeOfSchema: (meta: ECSNodeSchemaMeta) => FluidArchetype
    ) {

    }

    onRegisterNodeSchema(meta: ECSNodeSchemaMeta): void {
        const schemaSymbol = meta.id.getSymbol();
        const archetype = this.getArchetypeOfSchema(meta);
        const bitSet = archetype.getBitSet();

        // Update archetype -> schemas mapping
        let schemaSet = this.archetypeToSchemaMap.get(bitSet);
        if (!schemaSet) {
            schemaSet = new Set();
            this.archetypeToSchemaMap.set(bitSet, schemaSet);
        }
        schemaSet.add(schemaSymbol);

        // Update componentType -> schemas mapping|
        for (const componentType of Object.values(meta.schema)) {
            const typeSymbol = componentType.getId().getSymbol();
            let schemaSet = this.componentTypeToSchemasMap.get(typeSymbol);
            if (!schemaSet) {
                schemaSet = new Set();
                this.componentTypeToSchemasMap.set(typeSymbol, schemaSet);
            }
            schemaSet.add(schemaSymbol);
        }
    }

    onUnregisterNodeSchema(meta: ECSNodeSchemaMeta): void {
        const schemaSymbol = meta.id.getSymbol();
        const archetype = this.getArchetypeOfSchema(meta);
        const bitSet = archetype.getBitSet();

        // Update archetype -> schemas mapping
        const schemaSet = this.archetypeToSchemaMap.get(bitSet);
        if (schemaSet) {
            schemaSet.delete(schemaSymbol);
            if (schemaSet.size == 0)
                this.archetypeToSchemaMap.delete(bitSet);
        }

        // Update componentType -> schemas mapping
        for (const componentType of Object.values(meta.schema)) {
            const typeSymbol = componentType.getId().getSymbol();
            let schemaSet = this.componentTypeToSchemasMap.get(typeSymbol);
            if (schemaSet) {
                schemaSet.delete(schemaSymbol);
                if (schemaSet.size == 0)
                    this.componentTypeToSchemasMap.delete(typeSymbol);
            }
        }
    }

    private getLazyResolvedMetaIterable(schemaSymbolSet: Set<symbol>): Iterable<ECSNodeSchemaMeta> {
        return getLazyMappedIterable(schemaSymbolSet ?? FluidNodeSchemaIndex.EMPTY_SET, symbol => {
            const schema = this.getSchemaBySymbol(symbol);
            if (!schema) throw new Error(`Schema not found for symbol: ${String(symbol)}`);
            return schema;
        });
    }

    getSchemasWithComponentType<T>(componentType: ECSComponentType<T>): Iterable<ECSNodeSchemaMeta> {
        const typeSymbol = componentType.getId().getSymbol();
        const schemaSymbolSet = this.componentTypeToSchemasMap.get(typeSymbol);
        return this.getLazyResolvedMetaIterable(schemaSymbolSet);
    }

    getSchemasWithArchetype(archetype: ECSArchetype): Iterable<ECSNodeSchemaMeta> {
        if (!(archetype instanceof FluidArchetype))
            throw new Error("Unsupported archetype implementation passed to 'FluidNodeSchemaIndex.getSchemasWithArchetype'. Expected 'FluidArchetype'");

        const bitSet = archetype.getBitSet();
        const schemaSymbolSet = this.archetypeToSchemaMap.get(bitSet);
        return this.getLazyResolvedMetaIterable(schemaSymbolSet);
    }
}