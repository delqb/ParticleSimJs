import { Fluid } from "@fluid/Fluid";

export interface ProjectileComponent {
    generation: number;
    deathTime: number;
}

export const Projectile = Fluid.defineComponentType<ProjectileComponent>("Projectile");