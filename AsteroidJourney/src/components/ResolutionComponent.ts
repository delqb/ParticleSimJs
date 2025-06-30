import { Fluid } from "@fluid/Fluid";
import { Vec2 } from "@fluid/lib/spatial/Vector2";

export interface ResolutionComponent {
    resolution: Vec2;
};

export const Resolution = Fluid.defineComponentType<ResolutionComponent>("Resolution");
