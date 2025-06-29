import { Fluid } from "@fluid/Fluid";
import { Vec2 } from "@fluid/lib/spatial/Vector2";

export interface AccelerationComponent {
    acceleration: Vec2;
    angular: number;
};

export const Acceleration = Fluid.defineComponentType<AccelerationComponent>("Acceleration");