import {ECSComponentType} from "./ComponentType";

export interface ECSComponentTypeFactory {
    createComponentType<T>(name: string): ECSComponentType<T>;
}