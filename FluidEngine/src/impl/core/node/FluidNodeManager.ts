import { ECSArchetype } from "@fluid/core/archetype/Archetype";
import { ECSComponentType } from "@fluid/core/component/type/ComponentType";
import { ECSEntityArchetypeHook } from "@fluid/core/entity/EntityArchetypeHook";
import { ECSEntityId } from "@fluid/core/entity/EntityId";
import { ECSNodeFactory } from "@fluid/core/node/NodeFactory";
import { ECSNodeIndex } from "@fluid/core/node/NodeIndex";
import { ECSNodeManager } from "@fluid/core/node/NodeManager";
import { ECSNodeRepository } from "@fluid/core/node/NodeRepository";
import { ECSNodeSchemaArchetypeProvider } from "@fluid/core/node/schema/NodeSchemaArchetypeProvider";
import { ECSNodeSchemaIndex } from "@fluid/core/node/schema/NodeSchemaIndex";
import { ECSNodeSchemaRegistry } from "@fluid/core/node/schema/NodeSchemaRegistry";

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