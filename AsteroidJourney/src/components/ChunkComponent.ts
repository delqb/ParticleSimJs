
/**
 * Component used to associate an entity with a 'Chunk' instance. 
 * 
 * This enables world chunks to be represented as entities within the ECS.
 * 
 * @property chunk: The underlying 'Chunk' instance this entity represents.
 */
export type ChunkComponent = Component & {
    chunk: Chunk;
}

export function createChunkComponent(chunk: Chunk, key = "chunk"): ChunkComponent {
    return { key, chunk };
}