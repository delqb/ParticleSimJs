import { ECSNodeSchemaMeta } from "./NodeSchemaMeta";

export interface ECSNodeSchemaRegistryHook {
    onRegisterNodeSchema(meta: ECSNodeSchemaMeta): void;
    onUnregisterNodeSchema(meta: ECSNodeSchemaMeta): void;
}