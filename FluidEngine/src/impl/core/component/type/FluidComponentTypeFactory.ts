import { ECSComponentType, ECSComponentTypeRegistry } from "@fluidengine/core/component";
import { ECSComponentFactory } from "@fluidengine/core/component/ComponentFactory";
import { ECSComponentTypeFactory } from "@fluidengine/core/component/type/ComponentTypeFactory";
import { FluidComponentType } from "./FluidComponentType";
import { FluidComponentTypeId } from "./FluidComponentTypeId";
import { ECSComponentTypeRegistryHook } from "@fluidengine/core/component/type/ComponentTypeRegistryHook";

export class FluidComponentTypeFactory implements ECSComponentTypeFactory, ECSComponentTypeRegistryHook {
    private nextNumericId: number = 0;
    private removedNumericIds: Set<number> = new Set();

    constructor(
        private readonly componentFactory: ECSComponentFactory
    ) {
    }

    onRegisterComponentType<T>(registry: ECSComponentTypeRegistry, componentType: ECSComponentType<T>): void {
        // No action required
    }

    onUnregisterComponentType<T>(registry: ECSComponentTypeRegistry, componentType: ECSComponentType<T>): void {
        this.removedNumericIds.add(componentType.getId().getNumericId());
    }

    createComponentType<T>(name: string): ECSComponentType<T> {
        let numericId: number;
        if (this.removedNumericIds.size > 0) {
            numericId = this.removedNumericIds.values().next().value;
            this.removedNumericIds.delete(numericId);
        } else {
            numericId = this.nextNumericId++;
        }

        return new FluidComponentType<T>(new FluidComponentTypeId(name, numericId), this.componentFactory);
    }
}