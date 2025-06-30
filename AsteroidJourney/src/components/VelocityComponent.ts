import { Fluid } from "@fluid/Fluid";
import { Vec2 } from "@fluid/lib/spatial/Vector2";

export interface VelocityComponent {
    velocity: Vec2;
    angular: number;
};

export const Velocity = Fluid.defineComponentType<VelocityComponent>("Velocity");
