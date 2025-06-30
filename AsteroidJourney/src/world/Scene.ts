import { ECSComponent } from "@fluid/core/component/Component";
import { ECSEntityId } from "@fluid/core/entity/EntityId";
import { Fluid } from "@fluid/Fluid";

export interface ReloadableEntity {
    readonly entityId: ECSEntityId;
    components: ECSComponent<any>[];
    load(): boolean;
    unload(): boolean;
}

class ReloadableEntityImpl implements ReloadableEntity {
    constructor(
        readonly entityId: ECSEntityId,
        public components: ECSComponent<any>[] = []
    ) {
    }

    load(): boolean {
        const entityId = this.entityId
        const core = Fluid.core();
        const entityManager = core.getEntityManager();
        const componentRepo = core.getComponentManager().getComponentRepository();

        if (entityManager.hasEntity(entityId))
            return false;

        entityManager.addEntity(entityId);

        if (this.components.length > 0) {
            for (const component of this.components) {
                componentRepo.addComponent(component, entityId);
            }
        }
        return true;
    }

    unload(): boolean {
        const entityId = this.entityId;
        const core = Fluid.core();
        if (core.getEntityManager().hasEntity(entityId)) {
            this.components = Array.from(core.getComponentManager().getComponentRepository().getEntityComponents(entityId));
            Fluid.removeEntity(entityId);
            return true;
        }
        return false
    }
}

export class SceneFacade {
    private static entityMap: Map<symbol, ReloadableEntity> = new Map();

    static unloadEntity(entityId: ECSEntityId): ReloadableEntity {
        const entitySymbol = entityId.getSymbol();
        let rEntity = this.entityMap.get(entitySymbol);
        if (!rEntity) {
            rEntity = new ReloadableEntityImpl(entityId, []);
            this.entityMap.set(entitySymbol, rEntity);
        }
        rEntity.unload();
        return rEntity;
    }

    static loadEntity(entitySymbol: symbol): boolean {
        const rEntity = this.entityMap.get(entitySymbol);
        return rEntity ? rEntity.load() : false;
    }
}