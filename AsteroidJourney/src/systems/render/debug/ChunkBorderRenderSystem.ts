import {ClientContext} from "@asteroid/client/Client";
import {ChunkComponent} from "@asteroid/components/ChunkComponent";
import {EntityID, System} from "@fluidengine/core";
import {ChunkState, getChunkCornerFromIndex} from "@fluidengine/lib/world/chunk/Chunk";

type ChunkNode = {
    chunk: ChunkComponent;
}

const lineWidth = 1 / 1000;
const color = "red";

export class ChunkBorderRenderSystem extends System<ChunkNode> {
    NODE_COMPONENT_KEYS: Set<keyof ChunkNode> = new Set(["chunk"]);
    constructor(public clientContext: ClientContext) {
        super();
    }
    public updateNode(node: ChunkNode, entityID: EntityID): void {
        const clientContext = this.clientContext;
        if (!clientContext.displayChunks)
            return;
        const ctx = this.clientContext.renderer.renderContext;
        const chunk = node.chunk.chunk;
        if (chunk.state !== ChunkState.Loaded) return;
        const { index, size } = chunk;
        const corner = getChunkCornerFromIndex(index[0], index[1], size);

        ctx.save();
        ctx.translate(corner.x, corner.y);
        ctx.lineWidth = lineWidth * 4 / 3;
        ctx.strokeStyle = "white";
        ctx.strokeRect(0, 0, size, size);
        ctx.lineWidth = lineWidth;
        ctx.strokeStyle = color;
        ctx.strokeRect(0, 0, size, size);
        ctx.restore();
    }

}