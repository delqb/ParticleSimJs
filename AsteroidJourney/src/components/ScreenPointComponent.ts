import { Fluid } from "@fluid/Fluid";
import { Vec2 } from "@fluid/lib/spatial/Vector2";

export interface ScreenPointComponent {
    point: Vec2;
};

export const ScreenPoint = Fluid.defineComponentType<ScreenPointComponent>("Screen Point");
