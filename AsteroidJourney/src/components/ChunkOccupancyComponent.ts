import { Component } from "@fluidengine/core";
import { ChunkKey } from "@fluidengine/lib/world";

/**
 * Component that tracks the set of chunks currently occupied by an entity.
 *
 * @property chunkKeys: A set containing keys of all chunks occupied by the entity.
 */
export type ChunkOccupancyComponent = Component & {
    chunkKeys: Set<ChunkKey>;
};

/**
 * Factory function to create a `ChunkOccupancyComponent`.
 *
 * @param chunkKeys Optional initial set of chunk keys; defaults to an empty set.
 * @param key Optional component key identifier; defaults to "chunks".
 * @returns A new instance of `ChunkOccupancyComponent`.
 */
export function createChunkOccupancyComponent(chunkKeys: Set<ChunkKey> = new Set(), key = "chunks"): ChunkOccupancyComponent {
    return { key, chunkKeys };
}