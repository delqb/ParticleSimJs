import { EntityID, System, Vector2 } from "../../../engine/FluidECS.js";
import { PositionComponent, ScreenPointComponent, CursorTranslateComponent } from "../../Components.js";
import { engine } from "../../AsteroidJourney.js";

export type CursorSystemNode = {
    position: PositionComponent;
    screenPoint: ScreenPointComponent;
    cursorTranslate: CursorTranslateComponent;
}

export class CursorSystem extends System<CursorSystemNode> {
    NODE_COMPONENT_KEYS: Set<keyof CursorSystemNode> = new Set(['position', 'screenPoint', 'cursorTranslate']);
    public updateNode(node: CursorSystemNode, entityID: EntityID) {
        node.position.position =
            Vector2.add(
                node.cursorTranslate.cursorTranslate,
                Vector2.scale(node.screenPoint.point, 1 / engine.PIXELS_PER_METER)
            );
    }
}