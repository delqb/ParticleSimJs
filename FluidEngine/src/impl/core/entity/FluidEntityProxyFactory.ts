import { ECSComponentRepository } from "@fluid/core/component/ComponentRepository";
import { ECSEntityId } from "@fluid/core/entity/EntityId";
import { ECSEntityProxy } from "@fluid/core/entity/EntityProxy";
import { ECSEntityProxyFactory } from "@fluid/core/entity/EntityProxyFactory";
import { FluidEntityProxy } from "./FluidEntityProxy";

export class FluidEntityProxyFactory implements ECSEntityProxyFactory {
    constructor(
        private readonly componentRepository: ECSComponentRepository
    ) { }

    createProxy(entityId: ECSEntityId): ECSEntityProxy {
        return new FluidEntityProxy(entityId, this.componentRepository);
    }
}