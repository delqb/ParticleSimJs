import {ECSComponentType} from "./ComponentType";
import {ECSComponentTypeId} from "./ComponentTypeId";

export interface ECSComponentTypeRegistry {
    hasComponentType(id: ECSComponentTypeId): boolean;
    getComponentType<T>(id: ECSComponentTypeId): ECSComponentType<T>;
    addComponentType<T>(componentType: ECSComponentType<T>): void;
    removeComponentType(id: ECSComponentTypeId): void;
}
