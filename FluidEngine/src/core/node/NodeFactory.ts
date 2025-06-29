import { ECSEntityId } from "../entity";
import { ECSNode } from "./Node";
import { ECSNodeSchema } from "./schema/NodeSchema";
import { ECSNodeSchemaMeta } from "./schema/NodeSchemaMeta";

export interface ECSNodeFactory {
    createNode<S extends ECSNodeSchema>(schemaMeta: ECSNodeSchemaMeta, entityId: ECSEntityId): ECSNode<S>;
}