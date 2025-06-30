import { ECSComponent } from "@fluid/core/component/Component";
import { ECSComponentFactory } from "@fluid/core/component/ComponentFactory";
import { ECSComponentType } from "@fluid/core/component/type/ComponentType";
import { ECSComponentTypeId } from "@fluid/core/component/type/ComponentTypeId";
import { FluidComponentTypeId } from "./FluidComponentTypeId";

export class FluidComponentType<T> implements ECSComponentType<T> {
    constructor(
        private readonly id: FluidComponentTypeId,
        private readonly factory: ECSComponentFactory
    ) {
    }

    getId(): ECSComponentTypeId {
        return this.id;
    }

    is(component: ECSComponent<any>): component is ECSComponent<T> {
        return this.id.equals(component.componentTypeId);
    }

    createComponent(data: T, copyData: boolean = false): ECSComponent<T> {
        return this.factory.createComponent(this, data, copyData);
    }
}