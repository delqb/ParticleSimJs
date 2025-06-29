import { CoreRuntime } from "@fluidengine/core/CoreRuntime";
import { Core } from "./core/Core";
import { ECSComponentType } from "./core/component";

export class Fluid {
    static core(): Core {
        return CoreRuntime.getInstance();
    }

    /**
     * Defines and internally registers a new component type with `T` as the shape of its data and `name` attached to it.
     * 
     * @param name A descriptive string for this type. This value will be attached to the type and will only be used for debugging and logging. It is not used for identity checks.
     * @returns A unique component type with `T` as the shape of its data and `name` attached to it.
     */
    static defineComponentType<T>(name: string): ECSComponentType<T> {
        const componentManager = Fluid.core().getComponentManager();
        const componentType = componentManager.getComponentTypeFactory().createComponentType<T>(name);
        componentManager.getComponentTypeRegistry().addComponentType(componentType);
        return componentType;
    }

}