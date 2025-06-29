import { ECSEntityFactory, ECSEntityId, ECSEntityManager, ECSEntityProxy } from "@fluidengine/core/entity";
import { ECSEntityProxyFactory } from "@fluidengine/core/entity/EntityProxyFactory";


export class FluidEntityManager implements ECSEntityManager {
    private readonly idMap: Map<symbol, ECSEntityId> = new Map();
    private readonly proxyMap: Map<symbol, ECSEntityProxy> = new Map();

    constructor(
        private readonly entityFactory: ECSEntityFactory,
        private readonly proxyFactory: ECSEntityProxyFactory
    ) {

    }

    getEntities(): Iterable<ECSEntityId> {
        return this.idMap.values();
    }

    hasEntity(entityId: ECSEntityId): boolean {
        return this.idMap.has(entityId.getSymbol());
    }

    removeEntity(entityId: ECSEntityId): void {
        this.idMap.delete(entityId.getSymbol());
        this.proxyMap.delete(entityId.getSymbol());
    }

    addEntity(entityId: ECSEntityId): void {
        this.idMap.set(entityId.getSymbol(), entityId);
    }

    createEntity(): ECSEntityId {
        const id = this.entityFactory.createEntityId();
        this.addEntity(id);
        return id;
    }

    getEntityProxy(entityId: ECSEntityId): ECSEntityProxy {
        const key = entityId.getSymbol();
        let proxy = this.proxyMap.get(key);
        if (!proxy) {
            proxy = this.proxyFactory.createProxy(entityId);
            this.proxyMap.set(key, proxy);
        }
        return proxy;
    }
}