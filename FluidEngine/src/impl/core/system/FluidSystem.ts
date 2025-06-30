import { ECSNode } from "@fluid/core/node/Node";
import { ECSNodeSchema } from "@fluid/core/node/schema/NodeSchema";
import { ECSNodeSchemaMeta } from "@fluid/core/node/schema/NodeSchemaMeta";
import { ECSSystem } from "@fluid/core/system/System";
import { ECSSystemMeta } from "@fluid/core/system/SystemMeta";
import { FluidSystemMeta } from "./FluidSystemMeta";

export abstract class FluidSystem<S extends ECSNodeSchema> implements ECSSystem<S> {
    private readonly systemMeta: ECSSystemMeta;
    constructor(
        name: string,
        nodeSchemaMeta: ECSNodeSchemaMeta
    ) {
        this.systemMeta = new FluidSystemMeta(name, nodeSchemaMeta);
    }

    getSystemMeta(): ECSSystemMeta {
        return this.systemMeta;
    }

    updateNode?(node: ECSNode<S>): void;

    updateNodes(nodes: Iterable<ECSNode<S>>): void {
        for (const node of nodes) {
            if (this.updateNode)
                this.updateNode(node);
        }
    };
}