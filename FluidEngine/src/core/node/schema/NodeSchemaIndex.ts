import {ECSComponentType} from "@fluid/core/component/type/ComponentType";
import {ECSNodeSchemaMeta} from "./NodeSchemaMeta";
import {ECSArchetype} from "@fluid/core/archetype/Archetype";

export interface ECSNodeSchemaIndex {
    getSchemasWithComponentType<T>(componentType: ECSComponentType<T>): Iterable<ECSNodeSchemaMeta>;
    getSchemasWithArchetype(archetype: ECSArchetype): Iterable<ECSNodeSchemaMeta>;
}