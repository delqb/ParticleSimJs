import { Fluid } from "@fluid/Fluid";

export interface CameraSpeedFactorComponent {
    speedFactor: number;
};

export const CameraSpeedFactor = Fluid.defineComponentType<CameraSpeedFactorComponent>("Camera Speed Factor");
