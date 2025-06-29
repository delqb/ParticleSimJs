import {ECSComponentType} from "../component";

export interface ECSArchetype {
    equals(other: ECSArchetype): boolean;
    isSuperSetOf(other: ECSArchetype): boolean;
    has<T>(componentType: ECSComponentType<T>): boolean;
    with<T>(componentType: ECSComponentType<T>): ECSArchetype;
    without<T>(componentType: ECSComponentType<T>): ECSArchetype;
}