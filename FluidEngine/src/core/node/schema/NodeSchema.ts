import {ECSComponentType} from "@fluid/core/component/type/ComponentType";

export type ECSNodeSchema = {
    readonly [key: string]: ECSComponentType<any>;
};

