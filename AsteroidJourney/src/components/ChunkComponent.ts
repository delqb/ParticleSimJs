import { Fluid } from "@fluid/Fluid";
import { ChunkMeta } from "@fluid/lib/world/chunk/Chunk";

/**
 * Component used to associate an entity with a 'Chunk' instance. 
 * 
 * This enables world chunks to be represented as entities within the ECS.
 * 
 * @property chunk: The underlying 'Chunk' instance this entity represents.
 */
export interface ChunkComponent {
    chunk: ChunkMeta;
}

export const Chunk = Fluid.defineComponentType<ChunkComponent>("Chunk");