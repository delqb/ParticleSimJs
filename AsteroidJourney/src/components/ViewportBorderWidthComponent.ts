import { Fluid } from "@fluid/Fluid";

export interface ViewportBorderWidthComponent {
    borderWidth: number;
};

export const ViewportBorderWidth = Fluid.defineComponentType<ViewportBorderWidthComponent>("Viewport Border Width");