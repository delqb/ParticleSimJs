import { ECSEntityId } from "@fluidengine/core/entity";
import { ECSNode, ECSNodeIndex, ECSNodeRepository } from "@fluidengine/core/node";
import { ECSNodeSchema } from "@fluidengine/core/node/schema/NodeSchema";
import { ECSNodeSchemaId } from "@fluidengine/core/node/schema/NodeSchemaId";
import { ECSNodeSchemaMeta } from "@fluidengine/core/node/schema/NodeSchemaMeta";

export class FluidNodeRepository implements ECSNodeRepository, ECSNodeIndex {
    private static readonly EMPTY_ITERABLE: Iterable<ECSNode<ECSNodeSchema>> = Object.freeze([]);

    private readonly nodeMap: Map<symbol, Map<ECSEntityId, ECSNode<ECSNodeSchema>>> = new Map();

    constructor() {
    }

    private getInnerMap(schemaId: ECSNodeSchemaId): Map<ECSEntityId, ECSNode<ECSNodeSchema>> {
        const idSymbol = schemaId.getSymbol();

        const innerMap = this.nodeMap.get(idSymbol);
        if (!innerMap)
            throw new Error(`Failed to retrieve node with schema '${schemaId.getName()}': schema id was not set in node repository.`);

        return innerMap;
    }

    hasNode(schemaId: ECSNodeSchemaId, entityId: ECSEntityId): boolean {
        const idSymbol = schemaId.getSymbol();
        const innerMap = this.nodeMap.get(idSymbol);
        return (innerMap && innerMap.has(entityId));
    }

    getNode<S extends ECSNodeSchema>(schemaId: ECSNodeSchemaId, entityId: ECSEntityId): ECSNode<S> {
        const innerMap = this.getInnerMap(schemaId);
        const node = innerMap.get(entityId);
        if (!node) {
            throw new Error(`Failed to get a node with schema '${schemaId.getName()}' for entity id '${entityId.toString()}': node not found.`);
        }

        return (node as ECSNode<S>);
    }

    removeNode(schemaId: ECSNodeSchemaId, entityId: ECSEntityId): void {
        const innerMap = this.getInnerMap(schemaId);
        const node = innerMap.get(entityId);
        if (!node) {
            throw new Error(`Failed to remove a node with schema '${schemaId.getName()}' for entity id '${entityId.toString()}': node not found.`);
        }

        innerMap.delete(entityId);
    }

    hasNodes(schemaId: ECSNodeSchemaId): boolean {
        const idSymbol = schemaId.getSymbol();
        return this.nodeMap.has(idSymbol);
    }

    getNodes<S extends ECSNodeSchema>(schemaId: ECSNodeSchemaId): Iterable<ECSNode<S>> {
        const idSymbol = schemaId.getSymbol();
        const innerMap = this.nodeMap.get(idSymbol);
        return (innerMap?.values() ?? FluidNodeRepository.EMPTY_ITERABLE) as Iterable<ECSNode<S>>;
    }

    removeNodes(schemaId: ECSNodeSchemaId): void {
        const idSymbol = schemaId.getSymbol();
        this.nodeMap.delete(idSymbol);
    }

    addNode<S extends ECSNodeSchema>(schemaId: ECSNodeSchemaId, node: ECSNode<S>): void {
        const idSymbol = schemaId.getSymbol();

        let innerMap = this.nodeMap.get(idSymbol);
        if (innerMap && innerMap.has(node.entityId)) {
            throw new Error(`Failed to add node '${node}' with schema '${schemaId.getName()}': a node for this entity already exists under this schema.`);
        }

        if (!innerMap) {
            innerMap = new Map();
            this.nodeMap.set(idSymbol, innerMap);
        }

        innerMap.set(node.entityId, node);
    }

    getNodesWithSchema(meta: ECSNodeSchemaMeta): Iterable<ECSNode<ECSNodeSchema>> {
        return this.getNodes(meta.id)
    }
}