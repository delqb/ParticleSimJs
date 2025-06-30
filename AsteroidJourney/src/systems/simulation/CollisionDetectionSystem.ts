import { BoundingBox, BoundingBoxComponent } from "@asteroid/components/BoundingBoxComponent";
import { ChunkOccupancy } from "@asteroid/components/ChunkOccupancyComponent";
import { FluidEngine } from "@fluid/FluidEngine";
import { ECSNode } from "@fluid/core/node/Node";
import { Fluid } from "@fluid/Fluid";
import { FluidSystem } from "@fluid/impl/core/system/FluidSystem";
import { aabbsIntersect } from "@fluid/lib/spatial/AABB";
import { isSeparatingAxisExistent } from "@fluid/lib/spatial/ConvexPolygon";
import { ChunkKey } from "@fluid/lib/world/chunk/Chunk";

const schema = {
    boundingBox: BoundingBox,
    chunks: ChunkOccupancy
}
type Schema = typeof schema;
const nodeMeta = Fluid.registerNodeSchema(schema, "Collision Detection");

export class CollisionDetectionSystem extends FluidSystem<Schema> {
    constructor(public engineInstance: FluidEngine) {
        super("Collision Detection System", nodeMeta);
    }

    private getEntitiesPerChunk(nodes: Iterable<ECSNode<Schema>>): Iterable<ECSNode<Schema>[]> {
        // Get entity groups that occupy the same chunk
        // This is the first broad-phase reduction of collision check count

        // map of chunk -> entity -> node
        const chunkMap: Map<ChunkKey, Map<symbol, ECSNode<Schema>>> = new Map();

        for (const node of nodes) {
            // Skip nodes that do not have an aligned bounding box because they will not be checked for collision
            if (!node.boundingBox.aabb)
                continue;

            const entityChunks = node.chunks.chunkKeys;
            const entitySymbol = node.entityId.getSymbol();

            for (const chunk of entityChunks) {
                // Lazy load entity -> node map per chunk
                let entityMap = chunkMap.get(chunk);
                if (!entityMap) {
                    entityMap = new Map();
                    chunkMap.set(chunk, entityMap);
                }

                // Add entity -> node mapping if it has not been added
                if (!entityMap.has(entitySymbol))
                    entityMap.set(entitySymbol, node);
            }
        }

        return chunkMap.values().map(entityMap => Array.from(entityMap.values()));
    }

    private * sortAndSweep(groups: Iterable<ECSNode<Schema>[]>): Iterable<[ECSNode<Schema>, ECSNode<Schema>]> {
        // Further narrow checks using sort-and-sweep
        for (const group of groups) {
            //Skip groups with only one entity. Collision can only be done between at least two different entities
            if (group.length <= 1)
                continue;

            // Sort the nodes ascendingly along the x-axis using their AABBs
            group.sort(
                (nodeA, nodeB) => nodeA.boundingBox.aabb.minX - nodeB.boundingBox.aabb.minX
            );

            // Sweep
            const groupSize = group.length;
            for (let i = 0; i < groupSize; i++) {
                // The box on the left
                const nodeA = group[i];
                const boundingBoxA = nodeA.boundingBox;

                for (let j = i + 1; j < groupSize; j++) {
                    // The box on the right
                    const nodeB = group[j];
                    const boundingBoxB = nodeB.boundingBox;

                    // If the left boundary of the box on the right is not inside the box on the left
                    // -then these boxes are not intersecting, and since the group is sorted
                    // -the rest of the boxes will be to the right and will not intersect
                    // Skip the rest
                    if (boundingBoxB.aabb.minX > boundingBoxA.aabb.maxX) break;

                    yield [nodeA, nodeB];
                }
            }
        }
    }

    private * checkCollision(candidatePairs: Iterable<[ECSNode<Schema>, ECSNode<Schema>]>): Iterable<[ECSNode<Schema>, ECSNode<Schema>]> {
        for (const candidatePair of candidatePairs) {
            const nodeA = candidatePair[0];
            const nodeB = candidatePair[1];
            const boundingBoxA = nodeA.boundingBox;
            const boundingBoxB = nodeB.boundingBox;

            if (!aabbsIntersect(boundingBoxA.aabb, boundingBoxB.aabb))
                continue;

            if (!isSeparatingAxisExistent(boundingBoxA.obb.corners, boundingBoxB.obb.corners))
                yield [nodeA, nodeB];
        }
    }

    private onCollide(nodeA: ECSNode<Schema>, nodeB: ECSNode<Schema>) {
        // Temporary code for testing purposes.
        Fluid.removeEntity(nodeA.entityId);
        Fluid.removeEntity(nodeB.entityId);
    }

    public updateNodes(nodes: Iterable<ECSNode<Schema>>): void {
        const entityGroups = this.getEntitiesPerChunk(nodes);
        const candidates = this.sortAndSweep(entityGroups);
        const collided = this.checkCollision(candidates);
        for (const pair of collided) {
            this.onCollide(pair[0], pair[1]);
        }
    }
}