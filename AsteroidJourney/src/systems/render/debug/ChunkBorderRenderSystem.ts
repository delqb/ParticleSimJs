import { ClientContext } from "@asteroid/client/Client";
import { Chunk } from "@asteroid/components/ChunkComponent";
import { ECSNode } from "@fluid/core/node/Node";
import { Fluid } from "@fluid/Fluid";
import { FluidSystem } from "@fluid/impl/core/system/FluidSystem";
import { ChunkState, getChunkCornerFromIndex } from "@fluid/lib/world/chunk/Chunk";

const schema = {
    chunk: Chunk
}
type Schema = typeof schema;
const meta = Fluid.registerNodeSchema(schema, "Chunk");

const lineWidth = 1 / 1000;
const color = "red";

export class ChunkBorderRenderSystem extends FluidSystem<Schema> {
    constructor(public clientContext: ClientContext) {
        super("Chunk Border Render System", meta);
    }
    public updateNode(node: ECSNode<Schema>): void {
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