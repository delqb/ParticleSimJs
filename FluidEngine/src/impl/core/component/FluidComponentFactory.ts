import { ECSComponent, ECSComponentType } from "@fluidengine/core/component";
import { ECSComponentFactory } from "@fluidengine/core/component/ComponentFactory";
import { FluidComponent } from "./FluidComponent";

export class FluidComponentFactory implements ECSComponentFactory {
    createComponent<T>(componentType: ECSComponentType<T>, componentData: T, copyData: boolean): ECSComponent<T> {
        return new FluidComponent(componentType.getId(), copyData ? { ...componentData } : componentData);
    }
}