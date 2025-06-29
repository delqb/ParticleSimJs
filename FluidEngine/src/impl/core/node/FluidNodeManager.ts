import { ECSArchetype } from "@fluidengine/core/archetype";
import { ECSEntityArchetypeHook } from "@fluidengine/core/entity/EntityArchetypeHook";
import { ECSNodeSchemaArchetypeProvider } from "@fluidengine/core/node/schema/NodeSchemaArchetypeProvider";
import { ECSComponentType } from "@fluidengine/core/component";
import { ECSEntityId } from "@fluidengine/core/entity";
import { ECSNodeRepository, ECSNodeFactory, ECSNodeSchemaRegistry, ECSNodeIndex } from "@fluidengine/core/node";
import { ECSNodeManager } from "@fluidengine/core/node/NodeManager";
import { ECSNodeSchemaIndex } from "@fluidengine/core/node/schema/NodeSchemaIndex";

export class FluidNodeManager implements ECSNodeManager, ECSEntityArchetypeHook {
    constructor(
        private nodeRepository: ECSNodeRepository,
        private nodeIndex: ECSNodeIndex,
        private nodeFactory: ECSNodeFactory,
        private nodeSchemaRegistry: ECSNodeSchemaRegistry,
        private getArchetypeOfNodeSchema: ECSNodeSchemaArchetypeProvider,
        private nodeSchemaIndex: ECSNodeSchemaIndex
    ) { }

    getNodeIndex(): ECSNodeIndex {
        return this.nodeIndex;
    }

    getNodeRepository(): ECSNodeRepository {
        return this.nodeRepository;
    }

    getNodeFactory(): ECSNodeFactory {
        return this.nodeFactory;
    }

    getNodeSchemaRegistry(): ECSNodeSchemaRegistry {
        return this.nodeSchemaRegistry;
    }

    /*  
        Archetype Hook Implementation
    */

    onEntityArchetypeExpansion(entityId: ECSEntityId, addedComponentType: ECSComponentType<any>, previousArchetype: ECSArchetype, newArchetype: ECSArchetype): void {
        for (const schemaMeta of this.nodeSchemaIndex.getSchemasWithComponentType(addedComponentType)) {
            const schemaId = schemaMeta.id;
            const schemaArchetype = this.getArchetypeOfNodeSchema(schemaMeta);

            if (!newArchetype.isSuperSetOf(schemaArchetype))
                continue;

            if (this.nodeRepository.hasNode(schemaId, entityId))
                continue;

            try {
                const node = this.nodeFactory.createNode(schemaMeta, entityId);
                this.nodeRepository.addNode(schemaId, node);
            } catch (e) {
                throw new Error(
                    `Failed to create/add node for entity ${entityId.toString()} under schema '${schemaId.getName()}': ${e.message}`,
                    { cause: e }
                );
            }
        }
    }

    onEntityArchetypeReduction(entityId: ECSEntityId, removedComponentType: ECSComponentType<any>, previousArchetype: ECSArchetype, newArchetype: ECSArchetype): void {
        for (const schemaMeta of this.nodeSchemaIndex.getSchemasWithComponentType(removedComponentType)) {
            const schemaId = schemaMeta.id;
            const schemaArchetype = this.getArchetypeOfNodeSchema(schemaMeta);

            if (!newArchetype.isSuperSetOf(schemaArchetype) && this.nodeRepository.hasNode(schemaId, entityId)) {
                this.nodeRepository.removeNode(schemaId, entityId);
            }
        }
    }
}