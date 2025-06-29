import { ECSComponentTypeRegistry, ECSComponentRepository } from "@fluidengine/core/component";
import { ECSComponentFactory } from "@fluidengine/core/component/ComponentFactory";
import { ECSComponentManager } from "@fluidengine/core/component/ComponentManager";
import { ECSComponentTypeFactory } from "@fluidengine/core/component/type/ComponentTypeFactory";
import { ECSComponentTypeResolver } from "@fluidengine/core/component/type/ComponentTypeResolver";

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