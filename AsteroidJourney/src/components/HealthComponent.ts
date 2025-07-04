import { Fluid } from "@fluid/Fluid";

export interface HealthComponent {
    maxHealth: number;
    currentHealth: number;
}

export const Health = Fluid.defineComponentType<HealthComponent>("Health");
