import { Fluid } from "@fluid/Fluid";
import { ChunkKey } from "@fluid/lib/world/chunk/Chunk";

/**
 * Component that tracks the set of chunks currently occupied by an entity.
 *
 * @property chunkKeys: A set containing keys of all chunks occupied by the entity.
 */
export interface ChunkOccupancyComponent {
    chunkKeys: Set<ChunkKey>;
};

export const ChunkOccupancy = Fluid.defineComponentType<ChunkOccupancyComponent>("Chunk Occupancy");