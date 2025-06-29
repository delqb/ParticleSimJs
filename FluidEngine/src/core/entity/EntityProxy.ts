import {ECSComponent} from "../component/Component";
import {ECSComponentType} from "../component/type/ComponentType";

export interface ECSEntityProxy {
    hasComponent<T>(componentType: ECSComponentType<T>): boolean;

    getComponent<T>(componentType: ECSComponentType<T>): ECSComponent<T>;

    addComponent<T>(componentType: ECSComponentType<T>, component: ECSComponent<T>): void;

    removeComponent<T>(componentType: ECSComponentType<T>): void;
}