import {ECSNodeSchemaMeta} from "./NodeSchemaMeta";
import {ECSArchetype} from "../../archetype/Archetype";

export interface ECSNodeSchemaArchetypeProvider {
    (schema: ECSNodeSchemaMeta): ECSArchetype;
}