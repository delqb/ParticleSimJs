import {ChunkComponent} from "@asteroid/components/ChunkComponent";
import {WorldContext} from "@asteroid/world/World";
import {EntityID, System} from "@fluidengine/core";
import {FluidEngine} from "@fluidengine/FluidEngine";
import {ChunkState} from "@fluidengine/lib/world";

type ChunkNode = {
    chunk: ChunkComponent;
}

export class ChunkUnloadingSystem extends System<ChunkNode> {
    NODE_COMPONENT_KEYS: Set<keyof ChunkNode> = new Set(["chunk"]);
    constructor(private engineInstance: FluidEngine, private worldContext: WorldContext) {
        super();
    }

    public updateNode(node: ChunkNode, entityID: EntityID): void {
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