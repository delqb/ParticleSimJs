import { ECSComponent } from "../Component";
import { ECSComponentTypeId } from "./ComponentTypeId";

/**
 * Represents a type descriptor for a specific component kind. Serves as a factory and identifier for components of type `T`.
 */
export interface ECSComponentType<T> {
    getId(): ECSComponentTypeId;

    /**
     * Performs a runtime type check to determine whether the provided component instance
     * belongs to this component type.
     *
     * @param component The component instance to check.
     * @returns `true` if the component belongs to this component type; otherwise, `false`.
     */
    is(component: ECSComponent<any>): component is ECSComponent<T>;

    /**
     * Creates a new component instance using the provided data. 
     * If copyData is set to true, the provided component will contain a shallow copy of the given data object instead of
     * using this instance. 
     * 
     * If data mutation is not a concern, using the same data instance may be more favorable for performance.
     *
     * @param data An object representing the component's data.
     * @param copyData When set to true, a shallow copy of `data` is used in the returned component.
     * @returns A component with the given data.
     */
    createComponent(data: T, copyData?: boolean): ECSComponent<T>;
}