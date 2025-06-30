import { Fluid } from "@fluid/Fluid";

export interface BackgroundGridComponent {
    gridSize: number;
    gridLineWidth: number;
    gridLineColor: string;
};

export const BackgroundGrid = Fluid.defineComponentType<BackgroundGridComponent>("Background Grid");