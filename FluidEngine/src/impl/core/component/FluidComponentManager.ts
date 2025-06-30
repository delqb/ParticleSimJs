import { ECSComponent } from "@fluid/core/component/Component";
import { ECSComponentFactory } from "@fluid/core/component/ComponentFactory";
import { ECSComponentManager } from "@fluid/core/component/ComponentManager";
import { ECSComponentRepository } from "@fluid/core/component/ComponentRepository";
import { ECSComponentTypeFactory } from "@fluid/core/component/type/ComponentTypeFactory";
import { ECSComponentTypeRegistry } from "@fluid/core/component/type/ComponentTypeRegistry";
import { ECSComponentTypeResolver } from "@fluid/core/component/type/ComponentTypeResolver";

export class FluidComponentManager implements ECSComponentManager {
    constructor(
        private componentTypeFactory: ECSComponentTypeFactory,
        private componentTypeRegistry: ECSComponentTypeRegistry,
        private componentTypeResolver: ECSComponentTypeResolver,
        private componentFactory: ECSComponentFactory,
        private componentRepository: ECSComponentRepository,
    ) {
    }

    getComponentTypeResolver(): ECSComponentTypeResolver {
        return this.componentTypeResolver;
    }

    getComponentTypeFactory(): ECSComponentTypeFactory {
        return this.componentTypeFactory;
    }

    getComponentTypeRegistry(): ECSComponentTypeRegistry {
        return this.componentTypeRegistry;
    }

    getComponentFactory(): ECSComponentFactory {
        return this.componentFactory;
    }

    getComponentRepository(): ECSComponentRepository {
        return this.componentRepository;
    }
}