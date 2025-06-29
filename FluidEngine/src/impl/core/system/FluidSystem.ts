import { ECSNode } from "@fluid/core/node/Node";
import { ECSNodeSchema } from "@fluid/core/node/schema/NodeSchema";
import { ECSSystem } from "@fluid/core/system/System";
import { ECSSystemMeta } from "@fluid/core/system/SystemMeta";

export abstract class FluidSystem<S extends ECSNodeSchema> implements ECSSystem<S> {
    constructor(
        private readonly systemMeta: ECSSystemMeta
    ) {
    }

    getSystemMeta(): ECSSystemMeta {
        return this.systemMeta;
    }

    abstract updateNodes(nodes: Iterable<ECSNode<S>>): void;
}