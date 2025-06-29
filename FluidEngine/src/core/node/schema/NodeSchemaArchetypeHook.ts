import {ECSArchetype} from "@fluid/core/archetype/Archetype";
import {ECSNodeSchemaMeta} from "./NodeSchemaMeta";

export interface ECSNodeSchemaArchetypeHook {
    onRegisterSchemaArchetype(meta: ECSNodeSchemaMeta, archetype: ECSArchetype): void;
    onRemoveSchemaArchetype(meta: ECSNodeSchemaMeta, archetype: ECSArchetype): void;
}