import { ECSComponentRepository } from "@fluidengine/core/component";
import { ECSEntityId, ECSEntityProxy } from "@fluidengine/core/entity";
import { ECSEntityProxyFactory } from "@fluidengine/core/entity/EntityProxyFactory";
import { FluidEntityProxy } from "./FluidEntityProxy";

export class FluidEntityProxyFactory implements ECSEntityProxyFactory {
    constructor(
        private readonly componentRepository: ECSComponentRepository
    ) { }

    createProxy(entityId: ECSEntityId): ECSEntityProxy {
        return new FluidEntityProxy(entityId, this.componentRepository);
    }
}