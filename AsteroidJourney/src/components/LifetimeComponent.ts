import { Fluid } from "@fluid/Fluid"

export interface LifeTimeComponent {
    spawnTime: number,
    lifeDuration: number
}
export const LifeTime = Fluid.defineComponentType<LifeTimeComponent>("Lifetime");