import { Fluid } from "@fluid/Fluid";
import { Transform } from "@fluid/lib/spatial/Transform";

export interface SpriteComponent {
    image: HTMLImageElement;
    transform?: Transform;
    zIndex: number;
};

export const Sprite = Fluid.defineComponentType<SpriteComponent>("Sprite");