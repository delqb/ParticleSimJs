import { ECSComponent, ECSComponentTypeId } from "@fluidengine/core/component";

export class FluidComponent<T> implements ECSComponent<T> {
    constructor(
        readonly componentTypeId: ECSComponentTypeId,
        readonly data: T
    ) {
    }
}