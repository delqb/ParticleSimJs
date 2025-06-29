import { ECSComponentTypeId } from ".";

export interface ECSComponent<T> {
    readonly componentTypeId: ECSComponentTypeId;
    readonly data: T;
}