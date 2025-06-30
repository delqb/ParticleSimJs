import { CursorTranslate } from "@asteroid/components/CursorTranslateComponent";
import { ScreenPoint } from "@asteroid/components/ScreenPointComponent";
import { Position } from "@asteroid/components/PositionComponent";
import { FluidEngine } from "@fluid/FluidEngine";
import { ECSNode } from "@fluid/core/node/Node";
import { Fluid } from "@fluid/Fluid";
import { FluidSystem } from "@fluid/impl/core/system/FluidSystem";
import { Vector2 } from "@fluid/lib/spatial/Vector2";

const schema = {
    position: Position,
    screenPoint: ScreenPoint,
    cursorTranslate: CursorTranslate
}
type Schema = typeof schema;
const nodeMeta = Fluid.registerNodeSchema(schema, "Cursor Update");

export class CursorSystem extends FluidSystem<Schema> {
    constructor(public engineInstance: FluidEngine) {
        super("Cursor System", nodeMeta);
    }
    public updateNode(node: ECSNode<Schema>): void {
        node.position.position =
            Vector2.add(
                node.cursorTranslate.cursorTranslate,
                Vector2.scale(node.screenPoint.point, 1 / this.engineInstance.PIXELS_PER_METER)
            );
    }
}