import { ECSComponentType } from "@fluidengine/core/component";

export type ECSNodeSchema = {
    readonly [key: string]: ECSComponentType<any>;
};

