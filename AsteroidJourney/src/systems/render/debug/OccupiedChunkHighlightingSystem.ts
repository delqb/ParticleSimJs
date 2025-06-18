import {ClientContext} from "@asteroid/client/Client";
import {ChunkOccupancyComponent} from "@asteroid/components";
import {EntityID, System} from "@fluidengine/core";
import {getChunkCornerFromIndex, parseChunkKey} from "@fluidengine/lib/world";

type ChunkLoadingSystemNode = {
    chunks: ChunkOccupancyComponent;
}

const generalHighlightColor = "blue";
const renderCenterHighlightColor = "red"
const generalHighlightAlpha = 0.05;
const renderCenterHighlightAlpha = 0.35;

export class OccupiedChunkHighlightingSystem extends System<ChunkLoadingSystemNode> {
    NODE_COMPONENT_KEYS: Set<keyof ChunkLoadingSystemNode> = new Set(["chunks"]);
    constructor(private clientContext: ClientContext) {
        super();
    }

    public updateNode(node: ChunkLoadingSystemNode, entityID: EntityID): void {
        const clientContext = this.clientContext;
        if (!clientContext.displayChunks)
            return;

        const engine = clientContext.engineInstance,
            worldContext = clientContext.worldContext,
            ctx = clientContext.renderer.renderContext;
        const chunkSize = worldContext.chunkSize;
        const isRenderCenter = engine.getEntityByID(entityID).hasComponent("renderCenter");

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