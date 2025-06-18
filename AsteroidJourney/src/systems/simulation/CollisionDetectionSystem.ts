import { BoundingBoxComponent, ChunkOccupancyComponent } from "@asteroid/components";
import { Component, System, EntityID } from "@fluidengine/core";
import { FluidEngine } from "@fluidengine/FluidEngine";
import { aabbsIntersect, isSeparatingAxisExistent } from "@fluidengine/lib/spatial";
import { ChunkKey } from "@fluidengine/lib/world";

export type CollisionDetectionParametersComponent = Component & {
    checkRadius: number;
}

export function createCollisionDetectionParametersComponent(checkRadius: number, { key = 'collisionDetectionParameters' } = {}): CollisionDetectionParametersComponent {
    return { key, checkRadius };
}

export type CollisionDetectionNode = {
    boundingBox: BoundingBoxComponent;
    chunks: ChunkOccupancyComponent;
}

export class CollisionDetectionSystem extends System<CollisionDetectionNode> {
    NODE_COMPONENT_KEYS: Set<keyof CollisionDetectionNode> = new Set(['boundingBox', 'chunks']);
    constructor(public engineInstance: FluidEngine) {
        super();
    }
    public updateNode(node: CollisionDetectionNode, entityID: EntityID) {
        throw new Error("This system uses a different method for updates.");
    }

    private onCollide(entityID1: EntityID, entityID2: EntityID) {
        // Temporary code for testing purposes.
        this.engineInstance.removeEntity(entityID1);
        this.engineInstance.removeEntity(entityID2);
    }

    private checkCollision(bb1: BoundingBoxComponent, bb2: BoundingBoxComponent): boolean {
        if (!aabbsIntersect(bb1.aabb, bb2.aabb)) {
            return false;
        }
        return !isSeparatingAxisExistent(bb1.obb.corners, bb2.obb.corners);
    }

    public update(): void {
        const nodeMap = this.getNodeMap();
        // Map chunkKeys to the unique set of ids of the relevant entities within
        const chunkEntityMap: Map<ChunkKey, Set<EntityID>> = new Map();

        for (const [entityID, node] of nodeMap.entries()) {
            if (!node.boundingBox.aabb)
                continue;
            const chunkKeys = node.chunks.chunkKeys;
            for (const chunkKey of chunkKeys) {
                if (!chunkEntityMap.has(chunkKey))
                    chunkEntityMap.set(chunkKey, new Set());
                const idSet = chunkEntityMap.get(chunkKey);
                if (!idSet.has(entityID))
                    idSet.add(entityID);
            }
        }

        for (const idSet of chunkEntityMap.values()) {
            // Skip sets with only one entity ID
            if (idSet.size <= 1)
                continue;

            const sorted = [...idSet].sort(
                (a, b) => {
                    const n1 = nodeMap.get(a), n2 = nodeMap.get(b);
                    if (!n1 || !n2)
                        return 0;
                    return n1.boundingBox.aabb.minX - n2.boundingBox.aabb.minX;
                }
            );

            // Step 2: Sort and sweep
            for (let i = 0; i < sorted.length; i++) {
                const id1 = sorted[i];
                const n1 = nodeMap.get(id1);
                if (!n1) continue;
                const bb1 = n1.boundingBox;
                for (let j = i + 1; j < sorted.length; j++) {
                    const id2 = sorted[j];
                    const n2 = nodeMap.get(id2);
                    if (!n2) continue;
                    const bb2 = n2.boundingBox;

                    // If b.minX > a.maxX, then b (and all after it) cannot intersect with a
                    if (bb2.aabb.minX > bb1.aabb.maxX) break;

                    // Otherwise, they overlap along x-axis — check for collision
                    if (this.checkCollision(bb1, bb2))
                        this.onCollide(id1, id2);
                }
            }
        }
    }
}