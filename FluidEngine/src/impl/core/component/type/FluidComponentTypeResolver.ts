import { ECSComponentType, ECSComponentTypeRegistry } from "@fluidengine/core/component";
import { ECSComponentTypeRegistryHook } from "@fluidengine/core/component/type/ComponentTypeRegistryHook";
import { ECSComponentTypeResolver } from "@fluidengine/core/component/type/ComponentTypeResolver";

export class FluidComponentTypeResolver implements ECSComponentTypeResolver, ECSComponentTypeRegistryHook {
    private byNumericId: Map<number, ECSComponentType<any>> = new Map();
    private bySymbol: Map<symbol, ECSComponentType<any>> = new Map();

    private getOrThrowError<T, K>(
        keyTypeName: string,
        key: K,
        map: Map<K, ECSComponentType<T>>,
    ): ECSComponentType<T> {
        const componentType = map.get(key);
        if (!componentType) {
            throw new Error(`Failed to retrieve component type using key '${String(key)}' of type '${keyTypeName}'.`);
        }
        return componentType as ECSComponentType<T>;
    }

    private setOrThrowError<T, K>(
        keyTypeName: string,
        key: K,
        componentType: ECSComponentType<T>,
        map: Map<K, ECSComponentType<T>>
    ) {
        if (map.has(key)) {
            const existingTypeName = map.get(key).getId().getName();
            throw new Error(`Failed to store component type '${componentType.getId().getName()}' using key '${String(key)}' of type '${keyTypeName}': this key has already been set for component type '${existingTypeName}'`)
        }

        map.set(key, componentType);
    }

    onRegisterComponentType<T>(registry: ECSComponentTypeRegistry, componentType: ECSComponentType<T>): void {
        const id = componentType.getId();
        this.setOrThrowError("number", id.getNumericId(), componentType, this.byNumericId);
        this.setOrThrowError("symbol", id.getSymbol(), componentType, this.bySymbol);
    }

    onUnregisterComponentType<T>(registry: ECSComponentTypeRegistry, componentType: ECSComponentType<T>): void {
        const id = componentType.getId();

        this.byNumericId.delete(id.getNumericId());
        this.bySymbol.delete(id.getSymbol());
    }

    getBySymbol<T>(symId: symbol): ECSComponentType<T> {
        return this.getOrThrowError("symbol", symId, this.bySymbol);
    }

    getByNumericId<T>(numId: number): ECSComponentType<T> {
        return this.getOrThrowError("number", numId, this.byNumericId);
    }
}