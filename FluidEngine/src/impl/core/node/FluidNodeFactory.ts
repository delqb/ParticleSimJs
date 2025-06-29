import { ECSEntityComponentProvider } from "@fluid/core/entity/EntityComponentProvider";
import { ECSEntityId } from "@fluid/core/entity/EntityId";
import { ECSNode } from "@fluid/core/node/Node";
import { ECSNodeFactory } from "@fluid/core/node/NodeFactory";
import { ECSNodeSchema } from "@fluid/core/node/schema/NodeSchema";
import { ECSNodeSchemaMeta } from "@fluid/core/node/schema/NodeSchemaMeta";

export class FluidNodeFactory implements ECSNodeFactory {
    constructor(
        private getComponent: ECSEntityComponentProvider
    ) { }

    createNode<S extends ECSNodeSchema>(schemaMeta: ECSNodeSchemaMeta, entityId: ECSEntityId): ECSNode<S> {
        const schemaId = schemaMeta.id,
            schema = schemaMeta.schema;

        const node = { entityId };

        for (const [key, componentType] of Object.entries(schema)) {
            const component = this.getComponent(componentType, entityId);

            if (!component) {
                throw new Error(`Failed to create node from schema '${schemaId.getName()}': could not find component of type '${componentType.getId().getName()}' associated with entity id '${entityId.toString()}'`);
            }

            node[key] = component.data;
        }

        return node as ECSNode<S>;
    }
}