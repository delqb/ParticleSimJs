import { ECSNodeSchemaMeta } from "@fluid/core/node/schema/NodeSchemaMeta";
import { ECSSystemMeta } from "@fluid/core/system/SystemMeta";

export class FluidSystemMeta implements ECSSystemMeta {
    constructor(
        public readonly systemName: string,
        public readonly nodeSchemaMeta: ECSNodeSchemaMeta
    ) {
    }
}