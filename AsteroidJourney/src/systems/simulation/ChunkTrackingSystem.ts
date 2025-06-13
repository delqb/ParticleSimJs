import { PositionComponent, ChunkMembershipComponent } from "@asteroid/components";
import { WorldContext } from "@asteroid/world/World";
import { System, EntityID } from "@fluidengine/core";
import { FluidEngine } from "@fluidengine/FluidEngine";

type ChunkTrackingSystemNode = {
    position: PositionComponent;
}

export class ChunkTrackingSystem extends System<ChunkTrackingSystemNode> {
    NODE_COMPONENT_KEYS: Set<keyof ChunkTrackingSystemNode> = new Set(["position"]);
    constructor(public engineInstance: FluidEngine, public worldContext: WorldContext) {
        super();
    }
    public updateNode(node: ChunkTrackingSystemNode, entityID: EntityID): void {
        const { position } = node;

        const currentChunkKey = this.worldContext.computeChunkKeyFromSubCoordinates(position.position);
        let currentChunk = this.worldContext.getChunk(currentChunkKey);
        if (!currentChunk)
            return;

        const entity = this.engineInstance.getEntityByID(entityID);
        if (!entity) {
            throw new Error(`Could not update entity chunk because the entity was not found in the engine instance: Entity#${entityID}`);
        }

        let chunkMembershipComponent: ChunkMembershipComponent = entity.getComponent<ChunkMembershipComponent>('chunkMembership');
        if (!chunkMembershipComponent) {
            chunkMembershipComponent = {
                key: 'chunkMembership',
                chunkKey: currentChunkKey
            };
            currentChunk.entityIDSet.add(entityID);
            this.engineInstance.addEntityComponents(entity, chunkMembershipComponent);
        }

        const ownerChunkKey = chunkMembershipComponent.chunkKey;
        if (ownerChunkKey == currentChunkKey)
            return;

        let ownerChunk = this.worldContext.getChunk(ownerChunkKey);
        if (!ownerChunk)
            throw new Error(`Owner chunk is undefined: Entity#${entityID} Chunk#${ownerChunkKey}`);

        ownerChunk.entityIDSet.delete(entityID);
        currentChunk.entityIDSet.add(entityID);

        chunkMembershipComponent.chunkKey = currentChunkKey;
    }
}