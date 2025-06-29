import {ECSComponentTypeId} from "./type/ComponentTypeId";

export interface ECSComponent<T> {
    readonly componentTypeId: ECSComponentTypeId;
    readonly data: T;
}