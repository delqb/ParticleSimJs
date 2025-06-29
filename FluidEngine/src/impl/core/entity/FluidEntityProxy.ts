import { ECSComponent, ECSComponentRepository, ECSComponentType } from "@fluidengine/core/component";
import { ECSEntityId, ECSEntityProxy } from "@fluidengine/core/entity";


export class FluidEntityProxy implements ECSEntityProxy {
    constructor(
        private readonly entityId: ECSEntityId,
        private readonly componentRepository: ECSComponentRepository,
    ) {
    }

    hasComponent<T>(componentType: ECSComponentType<T>): boolean {
        return this.componentRepository.hasComponent(componentType, this.entityId);
    }

    getComponent<T>(componentType: ECSComponentType<T>): ECSComponent<T> {
        return this.componentRepository.getComponent(componentType, this.entityId);
    }

    addComponent<T>(componentType: ECSComponentType<T>, component: ECSComponent<T>): void {
        this.componentRepository.addComponent(componentType, component, this.entityId);
    }

    removeComponent<T>(componentType: ECSComponentType<T>): void {
        this.componentRepository.removeComponent(componentType, this.entityId);
    }
}
