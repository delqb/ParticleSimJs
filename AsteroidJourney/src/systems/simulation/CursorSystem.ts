import { PositionComponent, ScreenPointComponent, CursorTranslateComponent } from "@asteroid/components";
import { System, EntityID } from "@fluidengine/core";
import { FluidEngine } from "@fluidengine/FluidEngine";
import { Vector2 } from "@fluidengine/lib/spatial";

export type CursorSystemNode = {
    position: PositionComponent;
    screenPoint: ScreenPointComponent;
    cursorTranslate: CursorTranslateComponent;
}

export class CursorSystem extends System<CursorSystemNode> {
    NODE_COMPONENT_KEYS: Set<keyof CursorSystemNode> = new Set(['position', 'screenPoint', 'cursorTranslate']);
    constructor(public engineInstance: FluidEngine) {
        super();
    }
    public updateNode(node: CursorSystemNode, entityID: EntityID) {
        node.position.position =
            Vector2.add(
                node.cursorTranslate.cursorTranslate,
                Vector2.scale(node.screenPoint.point, 1 / this.engineInstance.PIXELS_PER_METER)
            );
    }
}