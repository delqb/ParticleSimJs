import { BoundingBoxComponent, PositionComponent, RenderCenterComponent } from "@asteroid/components";
import { ChunkOccupancyComponent } from "@asteroid/components/ChunkOccupancyComponent";
import { WorldContext } from "@asteroid/world/World";
import { System, EntityID } from "@fluidengine/core";
import { FluidEngine } from "@fluidengine/FluidEngine";
import { conservativeOBBRasterization } from "@fluidengine/lib/utils/GridUtils";
import { ChunkKey, ChunkState, getChunkIndexFromPosition, getChunkKeyFromIndex } from "@fluidengine/lib/world";

type ChunkOccupancyUpdateNode = {
    boundingBox: BoundingBoxComponent;
    chunks: ChunkOccupancyComponent;
}

/**
 * System responsible for maintaining accurate chunk occupancy information for entities.
 * 
 * This system monitors entities with bounding boxes and their associated chunk occupancy
 * components, updating which chunks an entity currently occupies based on spatial rasterization
 * of its oriented bounding box (OBB) or axis-aligned bounding box (AABB), preferring OBB when it is available.
 * 
 * The primary function is to:
 * - Determine the set of chunk keys overlapping the entity’s bounding box.
 * - Compare the new set of occupied chunks with the entity’s previously recorded chunk keys.
 * - Add the entity’s ID to new chunks' occupancy sets and remove it from chunks no longer occupied.
 * - Initiate unloading of the entity if all its occupied chunks are in an unloaded state.
 * partitions.
 */
export class ChunkOccupancyUpdateSystem extends System<ChunkOccupancyUpdateNode> {
    NODE_COMPONENT_KEYS: Set<keyof ChunkOccupancyUpdateNode> = new Set(["boundingBox", "chunks"]);
    constructor(public engineInstance: FluidEngine, public worldContext: WorldContext) {
        super();
    }
    public updateNode(node: ChunkOccupancyUpdateNode, entityID: EntityID): void {
        const { boundingBox: bb, chunks: entityChunksComp } = node;
        const entityChunkKeys = entityChunksComp.chunkKeys;
        const { aabb, obb, size, center } = bb;
        const { width, height } = size;
        const wc = this.worldContext;
        const chunkSize = wc.chunkSize;

        if (!obb && !aabb) return;

        let currentChunkKeys: Set<ChunkKey> = new Set();
        if (obb) {
            conservativeOBBRasterization(
                width,
                height,
                chunkSize,
                1.15, 1.15,
                obb.axes,
                center,
                3,
                (i, j) => {
                    currentChunkKeys.add(getChunkKeyFromIndex(i, j) as ChunkKey)
                }
            );
        } else if (aabb) {
            const { minX: left, maxX: right, minY: bottom, maxY: top } = aabb;
            const corners = [
                { x: left, y: bottom },
                { x: right, y: bottom },
                { x: right, y: top },
                { x: left, y: top }
            ];
            for (const v of corners) {
                const [i, j] = getChunkIndexFromPosition(v, chunkSize);
                currentChunkKeys.add(getChunkKeyFromIndex(i, j));
            }
        }

        if (currentChunkKeys.size == 0) return;

        if (entityChunkKeys.size === currentChunkKeys.size && [...entityChunkKeys].every(k => currentChunkKeys.has(k)))
            return;

        const toAdd = new Set<ChunkKey>();
        const toRemove = new Set<ChunkKey>();
        let unloadEntity = true;

        for (const chunkKey of currentChunkKeys) {
            // If any of the current chunks are loaded, do not unload entity.
            if (wc.getChunk(chunkKey)?.state === ChunkState.Loaded)
                unloadEntity = false;

            if (!entityChunkKeys.has(chunkKey)) {
                toAdd.add(chunkKey);
            }
        }

        for (const chunkKey of entityChunkKeys) {
            if (!currentChunkKeys.has(chunkKey)) {
                toRemove.add(chunkKey);
            }
        }

        entityChunksComp.chunkKeys = currentChunkKeys;

        for (const chunkKey of toAdd) {
            wc.getChunk(chunkKey)?.entityIDSet.add(entityID);
        }

        for (const chunkKey of toRemove) {
            wc.getChunk(chunkKey)?.entityIDSet.delete(entityID);
        }

        if (unloadEntity) {
            for (const chunkKey of currentChunkKeys)
                wc.unloadEntity(entityID, chunkKey);
        }
    }
}