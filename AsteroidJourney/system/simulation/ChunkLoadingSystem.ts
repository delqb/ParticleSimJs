import { backgroundTileImage, createSpriteEntity, engine } from "../../AsteroidJourney.js";
import { EntityID, System, Vec2, Vector2 } from "../../../engine/FluidECS.js";
import { PositionComponent, RenderCenterComponent } from "../../Components.js";
import { ChunkMeta, ChunkStore } from "../../world/Chunk.js";

type ChunkLoadingSystemNode = {
    renderCenter: RenderCenterComponent;
    position: PositionComponent;
}

export class ChunkLoadingSystem extends System<ChunkLoadingSystemNode> {
    NODE_COMPONENT_KEYS: Set<keyof ChunkLoadingSystemNode> = new Set(["renderCenter", "position"]);
    constructor(private chunkSize: number, private chunkStore: ChunkStore) {
        super();
    }
    getChunkSize() {
        return this.chunkSize;
    }
    getChunkCoordinates(position: Vec2): Vec2 {
        return {
            x: Math.floor(position.x / this.chunkSize),
            y: Math.floor(position.y / this.chunkSize)
        };
    }
    generateChunk(coordinates: Vec2): ChunkMeta {
        createSpriteEntity(Vector2.scale(coordinates, this.chunkSize), 0, backgroundTileImage, 0, { resolution: { x: this.chunkSize, y: this.chunkSize } });
        console.log(`${coordinates.x}, ${coordinates.y}`);
        return {
            lastAccessed: engine.getGameTime(),
            state: "loaded"
        }
    }
    public updateNode(node: ChunkLoadingSystemNode, entityID: EntityID): void {
        let renderDistance = node.renderCenter.renderDistance;
        let centerPos = node.position;
        let gameTime = engine.getGameTime();

        for (let dX = -renderDistance; dX <= renderDistance; dX++)
            for (let dY = -renderDistance; dY <= renderDistance; dY++) {
                let chunkCoords = this.getChunkCoordinates({
                    x: centerPos.position.x + dX * this.chunkSize,
                    y: centerPos.position.y + dY * this.chunkSize
                });
                let chunkMeta = this.chunkStore.get(chunkCoords);

                if (!chunkMeta) {
                    chunkMeta = this.generateChunk(chunkCoords);
                    this.chunkStore.set(chunkCoords, chunkMeta);
                }

                if (chunkMeta.state == "unloaded") {
                    this.chunkStore.load(chunkCoords).then(chunkMeta => {
                        return;
                    });
                }

                chunkMeta.lastAccessed = gameTime;
            }
    }
}