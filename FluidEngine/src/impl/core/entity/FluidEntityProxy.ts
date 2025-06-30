import { ECSComponent } from "@fluid/core/component/Component";
import { ECSComponentRepository } from "@fluid/core/component/ComponentRepository";
import { ECSComponentType } from "@fluid/core/component/type/ComponentType";
import { ECSEntityId } from "@fluid/core/entity/EntityId";
import { ECSEntityProxy } from "@fluid/core/entity/EntityProxy";


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

    addComponent<T>(component: ECSComponent<T>): void {
        this.componentRepository.addComponent(component, this.entityId);
    }

    removeComponent<T>(componentType: ECSComponentType<T>): void {
        this.componentRepository.removeComponent(componentType, this.entityId);
    }
}
