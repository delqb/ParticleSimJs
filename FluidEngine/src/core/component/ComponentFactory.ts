import {ECSComponent} from "./Component";
import {ECSComponentType} from "./type/ComponentType";

export interface ECSComponentFactory {
    /**
    * Creates a new component instance using the provided type and component data. 
    * If copyData is set to true, the provided component will contain a shallow copy of the given data object instead of
    * using the given instance. 
    * 
    * If data mutation is not a concern, using the same data instance may be more favorable for performance.
    *
    * @param componentType The type descriptor of the component to be created.
    * @param componentData An object representing the created component's data.
    * @param copyData When set to `true`, the returned component will contain a shallow copy of `data`.
    * @returns A component of the given type containing the given data.
    */
    createComponent<T>(componentType: ECSComponentType<T>, componentData: T, copyData: boolean): ECSComponent<T>;
}