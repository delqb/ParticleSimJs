import { Fluid } from "@fluid/Fluid";

export interface FireControlComponent {
    fireIntent: boolean;
};

export const FireControl = Fluid.defineComponentType<FireControlComponent>("Fire Control");
