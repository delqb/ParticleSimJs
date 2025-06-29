import { ECSNodeSchemaMeta } from "./NodeSchemaMeta";

export interface ECSNodeSchemaResolver {
    (idSymbol: symbol): ECSNodeSchemaMeta;
}