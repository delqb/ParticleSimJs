import { Fluid } from "@fluid/Fluid";

export interface EntityDeathComponent {
    readyToRemove: boolean
}

export const EntityDeath = Fluid.defineComponentType<EntityDeathComponent>("Entity Death");