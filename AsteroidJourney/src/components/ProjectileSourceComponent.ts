import { Fluid } from "@fluid/Fluid";
import { Transform } from "@fluid/lib/spatial/Transform";

export interface ProjectileSourceComponent {
    transform?: Transform;
    muzzleSpeed: number;
    fireRate: number;
    lastFireTime: number;
    projectileSize: number;
    projectileLifeTime: number;
}

export const ProjectileSource = Fluid.defineComponentType<ProjectileSourceComponent>("Projectile Source");
