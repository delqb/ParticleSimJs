import { ECSNode } from "@fluidengine/core/node";
import { ECSNodeSchema } from "@fluidengine/core/node/schema/NodeSchema";
import { ECSSystem, ECSSystemMeta } from "@fluidengine/core/system";

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