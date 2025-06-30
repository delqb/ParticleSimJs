import { Fluid } from "@fluid/Fluid";
import { Vec2 } from "@fluid/lib/spatial/Vector2";

export interface MovementControlComponent {
    accelerationInput: Vec2;
    yawInput: number;
};

export const MovementControl = Fluid.defineComponentType<MovementControlComponent>("Movement Control");
