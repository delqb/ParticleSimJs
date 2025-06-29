import {ECSNodeSchemaMeta} from "../node/schema/NodeSchemaMeta";

export interface ECSSystemMeta {
    readonly systemName: string;
    readonly nodeSchemaMeta: ECSNodeSchemaMeta;
}