import {ECSNodeSchema} from "./NodeSchema";
import {ECSNodeSchemaId} from "./NodeSchemaId";
import {ECSNodeSchemaMeta} from "./NodeSchemaMeta";

export interface ECSNodeSchemaRegistry {
    hasSchema(schemaId: ECSNodeSchemaId): boolean;
    getSchema(schemaId: ECSNodeSchemaId): ECSNodeSchemaMeta;
    addSchema(schema: ECSNodeSchema, name: string): ECSNodeSchemaMeta;
    removeSchema(schemaId: ECSNodeSchemaId): void;
}
