import { RenderCenter } from "@asteroid/components/RenderCenterComponent";
import { Position } from "@asteroid/components/PositionComponent";
import { WorldContext } from "@asteroid/world/World";
import { FluidEngine } from "@fluid/FluidEngine";
import { getChunkIndexFromPosition, getChunkKeyFromIndex, ChunkState } from "@fluid/lib/world/chunk/Chunk";
import { Fluid } from "@fluid/Fluid";
import { FluidSystem } from "@fluid/impl/core/system/FluidSystem";
import { ECSNode } from "@fluid/core/node/Node";
import { ECSNodeSchema } from "@fluid/core/node/schema/NodeSchema";

const floor = Math.floor;

const schema = {
    renderCenter: RenderCenter,
    position: Position
}

type Schema = typeof schema;
const nodeMeta = Fluid.registerNodeSchema(schema, "Chunk Loading");

export class ChunkLoadingSystem extends FluidSystem<Schema> {
    constructor(
        private engineInstance: FluidEngine,
        private worldContext: WorldContext
    ) {
        super("Chunk Loading System", nodeMeta);
    }

    public updateNode(node: ECSNode<Schema>): void {
        const worldContext = this.worldContext;
        const chunkSize = worldContext.chunkSize;
        const gameTime = this.engineInstance.getGameTime();
        const renderCenterPos = node.position.position,
            renderDistance = node.renderCenter.renderDistance;
        const [ci, cj] = getChunkIndexFromPosition(renderCenterPos, chunkSize);

        const renderDistanceInChunks = Math.ceil(renderDistance / chunkSize);

        for (let i = -renderDistanceInChunks; i <= renderDistanceInChunks; i++)
            for (let j = -renderDistanceInChunks; j <= renderDistanceInChunks; j++) {
                const idxX = ci + i,
                    idxY = cj + j;

                const chunkKey = getChunkKeyFromIndex(idxX, idxY);
                let chunk = worldContext.getChunk(chunkKey);

                if (!chunk || chunk.state == ChunkState.Unloaded) {
                    try {
                        chunk = worldContext.loadChunk(chunkKey);
                    } catch (error) {
                        console.error(`Failed to load chunk (chunk: ${chunkKey})`, error);
                        continue;
                    }
                }

                chunk.lastAccessed = gameTime;
            }
    }
}