import { Entity, EntityID } from "@fluidengine/core";
import { FluidEngine } from "@fluidengine/FluidEngine";
import { Chunk, ChunkIndex, ChunkKey, ChunkState, parseChunkKey } from "@fluidengine/lib/world";

export interface ChunkGenerator {
    (worldContext: WorldContext, chunkIndex: ChunkIndex, chunkSize: number): Chunk
}

export class WorldContext {
    private chunkMap: Map<ChunkKey, Chunk> = new Map();
    private unloadedEntitiesChunkMap = new Map<ChunkKey, Entity[]>();

    constructor(private engineInstance: FluidEngine, public readonly chunkSize: number, public readonly chunkTimeout: number, public generateChunk: ChunkGenerator) {
    }

    getChunk(key: ChunkKey): Chunk | undefined {
        return this.chunkMap.get(key);
    }

    setChunk(key: ChunkKey, chunk: Chunk): void {
        this.chunkMap.set(key, chunk);
    }

    loadChunk(key: ChunkKey): Chunk {
        let chunk = this.chunkMap.get(key);
        const unloadedEntities = this.unloadedEntitiesChunkMap.get(key);

        if (chunk?.state === ChunkState.Loaded) {
            throw new Error(`Chunk is already loaded (chunk: ${key})`);
        }

        if (chunk?.state === ChunkState.Unloaded && !unloadedEntities) {
            throw new Error(`Unloaded chunk entities are not defined (chunk: ${key})`);
        }

        if (!chunk) {
            chunk = this.generateChunk(this, parseChunkKey(key), this.chunkSize);
            this.setChunk(key, chunk);
        }

        if (unloadedEntities) {
            // Add all entities back to the engine
            unloadedEntities.forEach(e => this.engineInstance.addEntity(e));
            this.unloadedEntitiesChunkMap.delete(key);
        }

        chunk.state = ChunkState.Loaded;
        return chunk;
    }

    unloadEntity(entityID: EntityID, chunkKey: ChunkKey): void {
        const unloadedEntities: Entity[] = this.unloadedEntitiesChunkMap.get(chunkKey) || [];
        const entity = this.engineInstance.getEntityByID(entityID);
        if (entity) {
            unloadedEntities.push(entity);
            this.engineInstance.removeEntity(entityID);
        }
        this.unloadedEntitiesChunkMap.set(chunkKey, unloadedEntities);
        // else
        // console.warn(`Entity was not found in engine instance when unloading (entity: ${entityID}, chunk: ${chunkKey})\n\tIs this entity's chunk relationship current?`);
    }

    unloadChunk(key: ChunkKey): boolean {
        let chunk = this.chunkMap.get(key);

        if (!chunk) throw new Error(`Chunk is undefined (key: ${key})`);
        if (chunk.state === ChunkState.Unloaded) throw new Error(`Chunk is already unloaded (chunk: ${key})`);

        chunk.state = ChunkState.Unloaded;

        for (let entityID of chunk.entityIDSet) {
            this.unloadEntity(entityID, key);
        }

        return true;
    }

    getAllChunks(): Chunk[] {
        return Array.from(this.chunkMap.values());
    }
}
