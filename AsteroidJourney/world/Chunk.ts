import { Component, Vec2 } from "../../engine/FluidECS";

export type ChunkState = "loaded" | "unloaded";

export interface ChunkMeta {
    state: ChunkState;
    lastAccessed: number;
}

export interface ChunkStore {
    exists(coordinates: Vec2): boolean;
    get(coordinates: Vec2): ChunkMeta | undefined;
    set(coordinates: Vec2, chunkMeta: ChunkMeta): void;
    load(coordinates: Vec2): Promise<ChunkMeta>;
    unload(coordinates: Vec2): Promise<boolean>;
}