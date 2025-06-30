import { Fluid } from "@fluid/Fluid";
import { Vec2 } from "@fluid/lib/spatial/Vector2";

export interface PositionComponent {
    position: Vec2;
    rotation: number;
};

export const Position = Fluid.defineComponentType<PositionComponent>("Position");
