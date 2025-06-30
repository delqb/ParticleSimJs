import { Chunk } from "@asteroid/components/ChunkComponent";
import { WorldContext } from "@asteroid/world/World";
import { ECSNode } from "@fluid/core/node/Node";
import { Fluid } from "@fluid/Fluid";
import { FluidEngine } from "@fluid/FluidEngine";
import { FluidSystem } from "@fluid/impl/core/system/FluidSystem";
import { ChunkState } from "@fluid/lib/world/chunk/Chunk";

const schema = {
    chunk: Chunk
}
type Schema = typeof schema;
const nodeMeta = Fluid.registerNodeSchema(schema, "Chunk Unloading");

export class ChunkUnloadingSystem extends FluidSystem<Schema> {
    constructor(
        private engineInstance: FluidEngine,
        private worldContext: WorldContext
    ) {
        super("Chunk Unloading System", nodeMeta);
    }

    public updateNode(node: ECSNode<Schema>): void {
        const worldContext = this.worldContext;
        const { chunkTimeout } = this.worldContext;
        const gameTime = this.engineInstance.getGameTime();
        const chunk = node.chunk.chunk;

        if (chunk.state == ChunkState.Loaded && gameTime - chunk.lastAccessed >= chunkTimeout)
            try {
                worldContext.unloadChunk(chunk.key);
            } catch (error) {
                console.error(`Failed to unload chunk#${chunk.key}}:`, error);
            }
    }
}