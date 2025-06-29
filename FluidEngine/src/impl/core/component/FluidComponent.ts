import { ECSComponent } from "@fluid/core/component/Component";
import { ECSComponentTypeId } from "@fluid/core/component/type/ComponentTypeId";

export class FluidComponent<T> implements ECSComponent<T> {
    constructor(
        readonly componentTypeId: ECSComponentTypeId,
        readonly data: T
    ) {
    }
}