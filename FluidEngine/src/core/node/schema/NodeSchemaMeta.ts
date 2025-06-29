import {ECSNodeSchema} from "./NodeSchema";
import {ECSNodeSchemaId} from "./NodeSchemaId";

export interface ECSNodeSchemaMeta {
    readonly id: ECSNodeSchemaId;
    readonly schema: ECSNodeSchema;
}
