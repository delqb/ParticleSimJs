import { Fluid } from "@fluid/Fluid";
import { Vec2 } from "@fluid/lib/spatial/Vector2";

export interface CursorTranslateComponent {
    cursorTranslate: Vec2;
};

export const CursorTranslate = Fluid.defineComponentType<CursorTranslateComponent>("Cursor Translate");
