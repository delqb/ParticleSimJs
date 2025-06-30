import { Fluid } from "@fluid/Fluid";

export interface RenderCenterComponent {
    renderDistance: number;
};

export const RenderCenter = Fluid.defineComponentType<RenderCenterComponent>("Render Center");
