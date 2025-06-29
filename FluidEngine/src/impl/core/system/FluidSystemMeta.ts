import { ECSNodeSchemaMeta } from "@fluidengine/core/node/schema/NodeSchemaMeta";
import { ECSSystemMeta } from "@fluidengine/core/system";

export class FluidSystemMeta implements ECSSystemMeta {
    constructor(
        public readonly systemName: string,
        public readonly nodeSchemaMeta: ECSNodeSchemaMeta
    ) {
    }
}