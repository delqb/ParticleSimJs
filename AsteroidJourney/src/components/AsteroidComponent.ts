import { Fluid } from "@fluid/Fluid";

export interface AsteroidComponent {
    size: number
}

export const Asteroid = Fluid.defineComponentType<AsteroidComponent>("Asteroid");