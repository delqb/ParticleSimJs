import { EntityID, Entity } from "@fluidengine/core";
import { FluidEngine } from "@fluidengine/FluidEngine";
import { Vec2 } from "@fluidengine/lib/spatial";

export type ChunkState = "loaded" | "unloaded";

export interface Chunk {
    readonly coordinates: Vec2;
    state: ChunkState;
    lastAccessed: number;
    entityIDSet: Set<EntityID>;
}

export class WorldContext {
    private chunkMap: Map<string, Chunk> = new Map();
    private unloadedEntitiesChunkMap = new Map<string, Entity[]>();
    private inFlightLoads = new Map<string, Promise<Chunk>>();

    constructor(private engineInstance: FluidEngine, public readonly chunkSize: number, public readonly chunkTimeout: number, public generateChunk: (worldContext: WorldContext, chunkCoordinates: Vec2) => Chunk) {
    }

    deserializeChunkKeyToCoordinates(key: string): Vec2 {
        let s = key.split(",");
        return { x: parseInt(s[0]), y: parseInt(s[1]) };
    }

    computeChunkKey(chunkCoordinates: Vec2): string {
        return `${chunkCoordinates.x},${chunkCoordinates.y}`;
    }

    getChunkCoordinates(position: Vec2): Vec2 {
        return {
            x: Math.floor(position.x / this.chunkSize),
            y: Math.floor(position.y / this.chunkSize)
        };
    }

    computeChunkKeyFromSubCoordinates(subChunkCoordinates: Vec2): string {
        return this.computeChunkKey(this.getChunkCoordinates(subChunkCoordinates));
    }

    getChunk(key: string): Chunk | undefined {
        return this.chunkMap.get(key);
    }

    setChunk(key: string, chunk: Chunk): void {
        this.chunkMap.set(key, chunk);
    }

    loadChunk(key: string): Promise<Chunk> {
        const existing = this.inFlightLoads.get(key);
        if (existing) return existing;

        const loadPromise = new Promise<Chunk>((resolve, reject) => {
            let chunk = this.chunkMap.get(key);
            if (!chunk) {
                chunk = this.generateChunk(this, this.deserializeChunkKeyToCoordinates(key));
                this.setChunk(key, chunk);
                return resolve(chunk);
            }

            if (chunk.state === "loaded") return reject("Chunk is already loaded.");

            const entities = this.unloadedEntitiesChunkMap.get(key);
            if (!entities) return reject("Unloaded chunk entities are not defined.");

            // Add all entities back to the engine
            entities.forEach(e => this.engineInstance.addEntity(e));
            this.unloadedEntitiesChunkMap.delete(key);
            chunk.state = "loaded";

            resolve(chunk);
        });

        this.inFlightLoads.set(key, loadPromise);

        // Cleanup on settle
        loadPromise.finally(() => {
            this.inFlightLoads.delete(key);
        });

        return loadPromise;
    }

    unloadChunk(key: string): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            let chunk = this.chunkMap.get(key);

            if (!chunk) return reject("Chunk is undefined.");

            if (chunk.state == "unloaded") return reject("Chunk is already unloaded.");

            let entities: Entity[] = [];
            for (let entityID of chunk.entityIDSet) {
                const entity = this.engineInstance.getEntityByID(entityID);
                if (entity) {
                    entities.push(entity);
                    // entity.setRemoved(true); BUGGED - FIX LATER
                    this.engineInstance.removeEntity(entityID);
                }
                else
                    console.warn(`Entity was not found in engine instance during chunk unloading: EntityID#${entityID}`);
            }

            this.unloadedEntitiesChunkMap.set(key, entities);
            chunk.state = "unloaded";
            resolve(true);
        });
    }

    getAllChunks(): Chunk[] {
        return Array.from(this.chunkMap.values());
    }
}
