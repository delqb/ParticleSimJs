import { EntityID, System } from "../../../engine/FluidECS.js";
import { FluidEngine } from "../../../engine/FluidEngine.js";
import { PositionComponent, RenderCenterComponent } from "../../Components.js";
import { WorldContext } from "../../world/World.js";

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
        const world = this.worldContext;
        const { chunkSize, chunkTimeout } = world;

        let renderDistance = node.renderCenter.renderDistance;
        let renderDistanceChunks = Math.ceil(renderDistance / chunkSize);
        let renderCenterPos = node.position;
        let gameTime = this.engineInstance.getGameTime();

        for (let dX = -renderDistanceChunks; dX <= renderDistanceChunks; dX++)
            for (let dY = -renderDistanceChunks; dY <= renderDistanceChunks; dY++) {
                const chunkTouchPos = {
                    x: renderCenterPos.position.x + dX * chunkSize,
                    y: renderCenterPos.position.y + dY * chunkSize
                };
                const chunkCoords = world.getChunkCoordinates(chunkTouchPos);
                const chunkKey = world.computeChunkKey(chunkCoords);

                let chunk = world.getChunk(chunkKey);
                if (!chunk || (chunk && chunk.state == "unloaded")) {
                    void world.loadChunk(chunkKey).catch(err => console.error(`Failed to load chunk#${chunkKey}:`, err));
                    return;
                }
                chunk.lastAccessed = gameTime;
            }

        for (let chunk of world.getAllChunks()) {
            if (chunk.state == "loaded" && this.engineInstance.getGameTime() - chunk.lastAccessed >= chunkTimeout)
                void world.unloadChunk(world.computeChunkKey(chunk.coordinates)).catch(console.error);
        }
    }
}