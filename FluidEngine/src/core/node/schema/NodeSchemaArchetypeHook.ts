import { ECSArchetype } from "@fluidengine/core/archetype";
import { ECSNodeSchemaMeta } from "./NodeSchemaMeta";

export interface ECSNodeSchemaArchetypeHook {
    onRegisterSchemaArchetype(meta: ECSNodeSchemaMeta, archetype: ECSArchetype): void;
    onRemoveSchemaArchetype(meta: ECSNodeSchemaMeta, archetype: ECSArchetype): void;
}