import { Core } from "./core/Core";
import { CoreRuntime } from "./core/CoreRuntime";
import { ECSComponent } from "./core/component/Component";
import { ECSComponentType } from "./core/component/type/ComponentType";
import { ECSEntityId } from "./core/entity/EntityId";
import { ECSEntityProxy } from "./core/entity/EntityProxy";
import { ECSNodeSchema } from "./core/node/schema/NodeSchema";
import { ECSNodeSchemaMeta } from "./core/node/schema/NodeSchemaMeta";

export class Fluid {
    static core(): Core {
        return CoreRuntime.getInstance();
    }

    /**
     * Defines and internally registers a new component type with `T` as the shape of its data and `name` attached to it.
     * 
     * @param name A descriptive string for this type. This value will be attached to the type and will only be used for debugging and logging. It is not used for identity checks.
     * @returns A unique component type with `T` as the shape of its data and `name` attached to it.
     */
    static defineComponentType<T>(name: string): ECSComponentType<T> {
        const componentManager = Fluid.core().getComponentManager();
        const componentType = componentManager.getComponentTypeFactory().createComponentType<T>(name);
        componentManager.getComponentTypeRegistry().addComponentType(componentType);
        return componentType;
    }

    static registerNodeSchema<S extends ECSNodeSchema>(nodeSchema: S, name: string): ECSNodeSchemaMeta {
        return this.core().getNodeManager().getNodeSchemaRegistry().addSchema(nodeSchema, name);
    }

    static getEntityProxy(entityId: ECSEntityId): ECSEntityProxy {
        return this.core().getEntityManager().getEntityProxy(entityId);
    }

    static removeEntity(entityId: ECSEntityId): void {
        this.core().getEntityManager().removeEntity(entityId);
        this.core().getComponentManager().getComponentRepository().removeEntityComponents(entityId);
    }

    static addEntityComponent<T>(entityId: ECSEntityId, component: ECSComponent<T>): void {
        this.core().getComponentManager().getComponentRepository().addComponent(component, entityId);
    }

    static addEntityComponents(entityId: ECSEntityId, ...components: ECSComponent<any>[]) {
        const componentRepo = this.core().getComponentManager().getComponentRepository();
        for (const component of components) {
            componentRepo.addComponent(component, entityId);
        }
    }

    static createEntityWithComponents(...components: ECSComponent<any>[]): ECSEntityId {
        const entityId = this.core().getEntityManager().createEntity();
        this.addEntityComponents(entityId, ...components);
        return entityId;
    }
}