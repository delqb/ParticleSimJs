import { ECSArchetype } from "@fluidengine/core/archetype";
import { ECSNodeSchemaMeta } from "./NodeSchemaMeta";
import { ECSComponentType } from "@fluidengine/core/component";

export interface ECSNodeSchemaIndex {
    getSchemasWithComponentType<T>(componentType: ECSComponentType<T>): Iterable<ECSNodeSchemaMeta>;
    getSchemasWithArchetype(archetype: ECSArchetype): Iterable<ECSNodeSchemaMeta>;
}