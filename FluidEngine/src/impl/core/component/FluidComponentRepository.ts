import { ECSComponent } from "@fluid/core/component/Component";
import { ECSComponentRepository } from "@fluid/core/component/ComponentRepository";
import { ECSComponentRepositoryHook } from "@fluid/core/component/ComponentRepositoryHook";
import { ECSComponentType } from "@fluid/core/component/type/ComponentType";
import { ECSComponentTypeId } from "@fluid/core/component/type/ComponentTypeId";
import { ECSEntityId } from "@fluid/core/entity/EntityId";
import { HookDispatcher } from "@fluid/core/util/hook/HookDispatcher";

export class FluidComponentRepository implements ECSComponentRepository {
    private static readonly EMPTY_COMPONENT_TYPES: ReadonlyArray<ECSComponentType<any>> = Object.freeze([]);

    // Maps component type symbol -> (entity symbol -> component)
    private readonly componentTypeToComponentMap: Map<symbol, Map<symbol, ECSComponent<any>>> = new Map();
    // Maps entity symbol -> (component type symbol -> component type)
    private readonly entityToComponentTypesMap: Map<symbol, Map<symbol, ECSComponentType<any>>> = new Map();

    constructor(
        private readonly getComponentType: (componentTypeId: ECSComponentTypeId) => ECSComponentType<any>,
        private readonly hooks: HookDispatcher<ECSComponentRepositoryHook>
    ) {
    }

    private getEntityComponentMap<T>(
        componentType: ECSComponentType<T>
    ): Map<symbol, ECSComponent<T>> {
        const typeId = componentType.getId();
        const typeSymbol = typeId.getSymbol();
        const typeName = typeId.getName();
        const componentMap = this.componentTypeToComponentMap.get(typeSymbol);
        if (!componentMap) {
            throw new Error(
                `Could not find component with type '${typeName}' in repository: the component type key was not found in map.`
            );
        }
        return componentMap;
    }

    private withComponentEntry<T, R>(
        componentType: ECSComponentType<T>,
        entityId: ECSEntityId,
        operation:
            (componentMap: Map<symbol, ECSComponent<T>>, entityIdSymbol: symbol) => R
    ): R {
        const entitySymbol = entityId.getSymbol();
        const typeName = componentType.getId().getName();
        const componentMap = this.getEntityComponentMap(componentType);
        const component = componentMap.get(entitySymbol);
        if (!component) {
            throw new Error(
                `Could not find a component with type '${typeName}' from repository: entity '${entityId.toString()}' is not associated with a component of this type.`
            );
        }

        return operation(componentMap, entitySymbol);
    }

    private removeComponentType(
        typeSymbol: symbol,
        entitySymbol: symbol
    ): void {
        const typesMap = this.entityToComponentTypesMap.get(entitySymbol);
        if (typesMap) {
            typesMap.delete(typeSymbol);
            if (typesMap.size === 0) {
                this.entityToComponentTypesMap.delete(entitySymbol);
            }
        }
    }

    private addComponentType<T>(
        componentType: ECSComponentType<T>,
        entitySymbol: symbol
    ): void {
        const typeSymbol = componentType.getId().getSymbol();
        let componentTypesMap = this.entityToComponentTypesMap.get(entitySymbol);
        if (!componentTypesMap) {
            componentTypesMap = new Map();
            this.entityToComponentTypesMap.set(entitySymbol, componentTypesMap);
        }
        componentTypesMap.set(typeSymbol, componentType);
    }

    hasComponent<T>(
        componentType: ECSComponentType<T>,
        entityId: ECSEntityId
    ): boolean {
        const typeSymbol = componentType.getId().getSymbol();
        const entitySymbol = entityId.getSymbol();
        const innerMap = this.componentTypeToComponentMap.get(typeSymbol);

        return innerMap?.has(entitySymbol) ?? false;
    }

    getComponent<T>(
        componentType: ECSComponentType<T>,
        entityId: ECSEntityId
    ): ECSComponent<T> {
        return this.withComponentEntry(componentType, entityId, (map, key) => map.get(key)!);
    }

    addComponent<T>(
        component: ECSComponent<T>,
        entityId: ECSEntityId
    ): void {
        const typeId = component.componentTypeId;
        const componentType = this.getComponentType(typeId);
        const typeSymbol = typeId.getSymbol();
        const typeName = typeId.getName();
        const entitySymbol = entityId.getSymbol();

        let componentMap = this.componentTypeToComponentMap.get(typeSymbol);
        if (componentMap && componentMap.has(entitySymbol)) {
            throw new Error(
                `Could not add component with type '${typeName}' to repository: entity '${entityId.toString()}' is already associated with a component of this type.`
            );
        }

        if (!componentMap) {
            componentMap = new Map();
            this.componentTypeToComponentMap.set(typeSymbol, componentMap);
        }

        componentMap.set(entitySymbol, component);
        this.addComponentType(componentType, entitySymbol);
        this.hooks.invokeHooks(h => h.onAddComponent(componentType, component, entityId))
    }

    removeComponent<T>(
        componentType: ECSComponentType<T>,
        entityId: ECSEntityId
    ): void {
        const typeId = componentType.getId();
        const typeSymbol = typeId.getSymbol();
        const entitySymbol = entityId.getSymbol();
        const component = this.withComponentEntry(componentType, entityId, (map, key) => {
            const c = map.get(key);
            map.delete(key);
            if (map.size === 0) {
                this.componentTypeToComponentMap.delete(typeSymbol);
            }
            return c;
        });
        this.removeComponentType(typeSymbol, entitySymbol);

        this.hooks.invokeHooks(h => h.onRemoveComponent(componentType, component, entityId));
    }

    hasEntity(entityId: ECSEntityId): boolean {
        return this.entityToComponentTypesMap.has(entityId.getSymbol());
    }

    getEntityComponentTypes(entityId: ECSEntityId): Iterable<ECSComponentType<any>> {
        const entitySymbol = entityId.getSymbol();
        const componentTypesMap = this.entityToComponentTypesMap.get(entitySymbol);
        return componentTypesMap ? Array.from(componentTypesMap.values()) : FluidComponentRepository.EMPTY_COMPONENT_TYPES;
    }

    removeEntityComponents(entityId: ECSEntityId): void {
        const entitySymbol = entityId.getSymbol();
        const componentTypesMap = this.entityToComponentTypesMap.get(entitySymbol);
        if (componentTypesMap) {
            for (const componentType of Array.from(componentTypesMap.values())) {
                this.removeComponent(componentType, entityId);
            }
        }
    }
}