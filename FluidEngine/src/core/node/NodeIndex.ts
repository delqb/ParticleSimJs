import { ECSNode } from "./Node";
import { ECSNodeSchema } from "./schema/NodeSchema";
import { ECSNodeSchemaMeta } from "./schema/NodeSchemaMeta";

export interface ECSNodeIndex {
    getNodesWithSchema(meta: ECSNodeSchemaMeta): Iterable<ECSNode<ECSNodeSchema>>;
}