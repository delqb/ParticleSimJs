import {ECSComponentType} from "./ComponentType";

export interface ECSComponentTypeResolver {
    getBySymbol<T>(symbol: symbol): ECSComponentType<T>;
    getByNumericId<T>(numId: number): ECSComponentType<T>;
}