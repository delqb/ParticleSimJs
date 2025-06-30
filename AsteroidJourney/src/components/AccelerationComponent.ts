import { Fluid } from "@fluid/Fluid";
import { Vec2 } from "@fluid/lib/spatial/Vector2";

export class AccelerationComponent {
    constructor(
        public acceleration: Vec2,
        public angular: number
    ) {

    }
}

export const Acceleration = Fluid.defineComponentType<AccelerationComponent>("Acceleration");