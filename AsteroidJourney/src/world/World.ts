import { FluidEngine } from "@fluid/FluidEngine";
import { ChunkIndex, ChunkMeta, ChunkKey, ChunkState, parseChunkKey } from "@fluid/lib/world/chunk/Chunk";
import { SceneFacade } from "./Scene";
import { Fluid } from "@fluid/Fluid";
import { ECSEntityId } from "@fluid/core/entity/EntityId";

export interface ChunkGenerator {
    (worldContext: WorldContext, chunkIndex: ChunkIndex, chunkSize: number): ChunkMeta
}

export class WorldContext {
    private chunkMap: Map<ChunkKey, ChunkMeta> = new Map();
    // private unloadedEntitiesChunkMap = new Map<ChunkKey, Entity[]>();

    constructor(private engineInstance: FluidEngine, public readonly chunkSize: number, public readonly chunkTimeout: number, public generateChunk: ChunkGenerator) {
    }

    getChunk(key: ChunkKey): ChunkMeta | undefined {
        return this.chunkMap.get(key);
    }

    setChunk(key: ChunkKey, chunk: ChunkMeta): void {
        this.chunkMap.set(key, chunk);
    }

    loadChunk(key: ChunkKey): ChunkMeta {
        let chunk = this.chunkMap.get(key);
        // const unloadedEntities = this.unloadedEntitiesChunkMap.get(key);

        if (!chunk) {
            chunk = this.generateChunk(this, parseChunkKey(key), this.chunkSize);
            this.setChunk(key, chunk);
        } else {
            if (chunk.state === ChunkState.Loaded) {
                throw new Error(`Chunk is already loaded (chunk: ${key})`);
            }

            for (const entitySymbol of chunk.entitySymbolSet) {
                SceneFacade.loadEntity(entitySymbol);
            }
        }

        // if (chunk?.state === ChunkState.Unloaded && !unloadedEntities) {
        //     throw new Error(`Unloaded chunk entities are not defined (chunk: ${key})`);
        // }

        // if (unloadedEntities) {
        //     // Add all entities back to the engine
        //     unloadedEntities.forEach(e => this.engineInstance.addEntity(e));
        //     this.unloadedEntitiesChunkMap.delete(key);
        // }

        chunk.state = ChunkState.Loaded;
        return chunk;
    }

    unloadEntity(entityID: ECSEntityId, chunkKey: ChunkKey): void {
        // const unloadedEntities: Entity[] = this.unloadedEntitiesChunkMap.get(chunkKey) || [];
        // const entity = this.engineInstance.getEntityByID(entityID);
        // if (entity) {
        //     unloadedEntities.push(entity);
        //     Fluid.removeEntity(entityID);
        // }
        // this.unloadedEntitiesChunkMap.set(chunkKey, unloadedEntities);
        // else
        // console.warn(`Entity was not found in engine instance when unloading (entity: ${entityID}, chunk: ${chunkKey})\n\tIs this entity's chunk relationship current?`);

        SceneFacade.unloadEntity(entityID);
    }

    unloadChunk(key: ChunkKey): boolean {
        let chunk = this.chunkMap.get(key);

        if (!chunk) throw new Error(`Chunk is undefined (key: ${key})`);
        if (chunk.state === ChunkState.Unloaded) throw new Error(`Chunk is already unloaded (chunk: ${key})`);


        // for (let entityID of chunk.entitySymbolSet) {
        //     this.unloadEntity(entityID, key);
        // }

        const entityResolver = Fluid.core().getEntityManager().getEntityResolver();
        for (const entitySymbol of chunk.entitySymbolSet) {
            const entityId = entityResolver.getEntityBySymbol(entitySymbol);
            if (entityId)
                SceneFacade.unloadEntity(entityId);
        }

        chunk.state = ChunkState.Unloaded;
        return true;
    }

    getAllChunks(): ChunkMeta[] {
        return Array.from(this.chunkMap.values());
    }
}
