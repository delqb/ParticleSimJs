import { Fluid } from "@fluid/Fluid";

export interface ParticleComponent {
    radius: number;
    color: string;
};

export const Particle = Fluid.defineComponentType<ParticleComponent>("Particle");
