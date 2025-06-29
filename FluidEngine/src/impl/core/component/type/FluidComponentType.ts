import { ECSComponent, ECSComponentType, ECSComponentTypeId } from "@fluidengine/core/component";
import { FluidComponentTypeId } from "./FluidComponentTypeId";
import { ECSComponentFactory } from "@fluidengine/core/component/ComponentFactory";

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

    createComponent(data: T, copyData: boolean = true): ECSComponent<T> {
        return this.factory.createComponent(this, data, copyData);
    }
}