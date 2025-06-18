import { RenderCenterComponent, PositionComponent } from "@asteroid/components";
import { WorldContext } from "@asteroid/world/World";
import { System, EntityID } from "@fluidengine/core";
import { FluidEngine } from "@fluidengine/FluidEngine";
import { ChunkState, getChunkIndexFromPosition, getChunkKeyFromIndex } from "@fluidengine/lib/world";

const floor = Math.floor;

type ChunkLoadingSystemNode = {
    renderCenter: RenderCenterComponent;
    position: PositionComponent;
}

export class ChunkLoadingSystem extends System<ChunkLoadingSystemNode> {
    NODE_COMPONENT_KEYS: Set<keyof ChunkLoadingSystemNode> = new Set(["renderCenter", "position"]);
    constructor(private engineInstance: FluidEngine, private worldContext: WorldContext) {
        super();
    }

    public updateNode(node: ChunkLoadingSystemNode, entityID: EntityID): void {
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