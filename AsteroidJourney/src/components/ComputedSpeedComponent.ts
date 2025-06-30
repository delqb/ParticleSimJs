import { Fluid } from "@fluid/Fluid";
import { Vec2 } from "@fluid/lib/spatial/Vector2";

export interface ComputedSpeedComponent {
    computedSpeed: Vec2;
};

export const ComputedSpeed = Fluid.defineComponentType<ComputedSpeedComponent>("Computed Speed");
