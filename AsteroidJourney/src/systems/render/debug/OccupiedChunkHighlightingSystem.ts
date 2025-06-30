import { ClientContext } from "@asteroid/client/Client";
import { ChunkOccupancy } from "@asteroid/components/ChunkOccupancyComponent";
import { RenderCenter } from "@asteroid/components/RenderCenterComponent";
import { ECSNode } from "@fluid/core/node/Node";
import { Fluid } from "@fluid/Fluid";
import { FluidSystem } from "@fluid/impl/core/system/FluidSystem";
import { parseChunkKey, getChunkCornerFromIndex } from "@fluid/lib/world/chunk/Chunk";

const schema = {
    chunks: ChunkOccupancy
}
type Schema = typeof schema;
const nodeMeta = Fluid.registerNodeSchema(schema, "Occupied Chunk Highlighting");

const generalHighlightColor = "blue";
const renderCenterHighlightColor = "red"
const generalHighlightAlpha = 0.05;
const renderCenterHighlightAlpha = 0.35;

export class OccupiedChunkHighlightingSystem extends FluidSystem<Schema> {
    constructor(private clientContext: ClientContext) {
        super("Occupied Chunk Highlighting System", nodeMeta);
    }

    public updateNode(node: ECSNode<Schema>): void {
        const clientContext = this.clientContext;
        if (!clientContext.displayChunks)
            return;

        const worldContext = clientContext.worldContext,
            ctx = clientContext.renderer.renderContext;
        const chunkSize = worldContext.chunkSize;
        const proxy = Fluid.getEntityProxy(node.entityId);
        const isRenderCenter = proxy.hasComponent(RenderCenter);

        ctx.save();

        if (isRenderCenter) {
            ctx.globalAlpha = renderCenterHighlightAlpha;
            ctx.fillStyle = renderCenterHighlightColor;
        } else {
            ctx.globalAlpha = generalHighlightAlpha;
            ctx.fillStyle = generalHighlightColor;
        }

        for (let chunkKey of node.chunks.chunkKeys) {
            const index = parseChunkKey(chunkKey);
            const corner = getChunkCornerFromIndex(index[0], index[1], chunkSize);
            ctx.fillRect(corner.x, corner.y, chunkSize, chunkSize);
        }
        ctx.restore();
    }
}