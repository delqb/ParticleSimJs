import { EntityID, System } from "../../../engine/FluidECS.js";
import { WorldComponent, BackgroundGridComponent } from "../../Components.js";
import { CONTEXT } from "../../AsteroidJourney.js";

type WorldRenderNode = {
    world: WorldComponent;
    backgroundGrid: BackgroundGridComponent;
}

export class WorldRenderSystem extends System<WorldRenderNode> {
    NODE_COMPONENT_KEYS: Set<keyof WorldRenderNode> = new Set(['world', 'backgroundGrid']);
    public updateNode(node: WorldRenderNode, entityID: EntityID) {
        const { resolution, backgroundColor, borderWidth } = node.world;
        const { gridLineWidth, gridLineColor, gridSize } = node.backgroundGrid;
        const { x: width, y: height } = resolution;

        CONTEXT.fillStyle = backgroundColor;
        CONTEXT.fillRect(- borderWidth, - borderWidth, width + 2 * borderWidth, height + 2 * borderWidth);
        CONTEXT.strokeStyle = gridLineColor;
        CONTEXT.lineWidth = gridLineWidth;

        for (let vLine = 0; vLine <= width + gridLineWidth; vLine += gridSize) {
            CONTEXT.beginPath();
            CONTEXT.moveTo(vLine, 0);
            CONTEXT.lineTo(vLine, height);
            CONTEXT.stroke();
        }

        for (let hLine = 0; hLine <= height + gridLineWidth; hLine += gridSize) {
            CONTEXT.beginPath();
            CONTEXT.moveTo(0, hLine);
            CONTEXT.lineTo(width, hLine);
            CONTEXT.stroke();
        }
    }
}