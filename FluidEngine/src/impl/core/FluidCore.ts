import { ECSComponentManager } from "@fluid/core/component/ComponentManager";
import { ECSComponentRepositoryHook } from "@fluid/core/component/ComponentRepositoryHook";
import { ECSComponentTypeRegistryHook } from "@fluid/core/component/type/ComponentTypeRegistryHook";
import { ECSEntityArchetypeHook } from "@fluid/core/entity/EntityArchetypeHook";
import { ECSEntityId } from "@fluid/core/entity/EntityId";
import { ECSEntityManager } from "@fluid/core/entity/EntityManager";
import { ECSNodeManager } from "@fluid/core/node/NodeManager";
import { ECSNodeSchemaArchetypeHook } from "@fluid/core/node/schema/NodeSchemaArchetypeHook";
import { ECSNodeSchemaRegistryHook } from "@fluid/core/node/schema/NodeSchemaRegistryHook";
import { ECSNodeSchemaResolver } from "@fluid/core/node/schema/NodeSchemaResolver";
import { ECSSystemOrchestrator } from "@fluid/core/system/SystemOrchestrator";
import { FluidArchetypeRegistry } from "./archetype/FluidArchetypeRegistry";
import { FluidComponentFactory } from "./component/FluidComponentFactory";
import { FluidComponentManager } from "./component/FluidComponentManager";
import { FluidComponentRepository } from "./component/FluidComponentRepository";
import { FluidComponentTypeFactory } from "./component/type/FluidComponentTypeFactory";
import { FluidComponentTypeRegistry } from "./component/type/FluidComponentTypeRegistry";
import { FluidComponentTypeResolver } from "./component/type/FluidComponentTypeResolver";
import { FluidEntityArchetypeCoordinator } from "./entity/FluidEntityArchetypeCoordinator";
import { FluidEntityFactory } from "./entity/FluidEntityFactory";
import { FluidEntityManager } from "./entity/FluidEntityManager";
import { FluidEntityProxyFactory } from "./entity/FluidEntityProxyFactory";
import { FluidNodeFactory } from "./node/FluidNodeFactory";
import { FluidNodeManager } from "./node/FluidNodeManager";
import { FluidNodeRepository } from "./node/FluidNodeRepository";
import { FluidNodeSchemaArchetypeBridge } from "./node/schema/FluidNodeSchemaArchetypeBridge";
import { FluidNodeSchemaIndex } from "./node/schema/FluidNodeSchemaIndex";
import { FluidNodeSchemaRegistry } from "./node/schema/FluidNodeSchemaRegistry";
import { FluidSystemOrchestrator } from "./system/FluidSystemOrchestrator";
import { FluidHookDispatcher } from "./util/FluidHookDispatcher";
import { Core } from "@fluid/core/Core";



const FLUID_CORE_SYMBOL = Symbol.for("FluidCore");

export class FluidCore implements Core {
    static bootstrap(): FluidCore {
        // Prepare Component Manager
        const componentTypeRegistryHookDispatcher = new FluidHookDispatcher<ECSComponentTypeRegistryHook>();
        const componentTypeRegistry = new FluidComponentTypeRegistry(componentTypeRegistryHookDispatcher);

        const componentRepositoryHookDispatcher = new FluidHookDispatcher<ECSComponentRepositoryHook>();
        const componentRepository = new FluidComponentRepository(
            componentTypeRegistry.getComponentType.bind(componentTypeRegistry),
            componentRepositoryHookDispatcher
        );

        const componentFactory = new FluidComponentFactory();
        const componentTypeResolver = new FluidComponentTypeResolver();
        const componentTypeFactory = new FluidComponentTypeFactory(componentFactory);

        const componentManager = new FluidComponentManager(
            componentTypeFactory,
            componentTypeRegistry,
            componentTypeResolver,
            componentFactory,
            componentRepository
        );

        const archetypeRegistry = new FluidArchetypeRegistry();

        // Prepare Entity Archetype Coordinator
        const entityArchetypeHookDispatcher = new FluidHookDispatcher<ECSEntityArchetypeHook>();
        const entityArchetypeCoordinator = new FluidEntityArchetypeCoordinator(
            archetypeRegistry,
            (entityId: ECSEntityId) => componentRepository.getEntityComponentTypes(entityId),
            entityArchetypeHookDispatcher
        );

        // Prepare Node Schema-Archetype Bridge
        const nodeSchemaArchetypeHookDispatcher = new FluidHookDispatcher<ECSNodeSchemaArchetypeHook>();
        const nodeSchemaArchetypeBridge = new FluidNodeSchemaArchetypeBridge(
            archetypeRegistry,
            nodeSchemaArchetypeHookDispatcher
        );

        // Prepare Node Manager
        const nodeRepository = new FluidNodeRepository();
        const nodeFactory = new FluidNodeFactory(
            componentRepository.getComponent.bind(componentRepository)
        );

        const nodeSchemaRegistryHookDispatcher = new FluidHookDispatcher<ECSNodeSchemaRegistryHook>();
        const nodeSchemaRegistry = new FluidNodeSchemaRegistry(nodeSchemaRegistryHookDispatcher);

        const getNodeSchemaBySymbol: ECSNodeSchemaResolver = nodeSchemaRegistry.getSchemaBySymbol.bind(nodeSchemaRegistry);
        const getFluidArchetypeOfNodeSchema = nodeSchemaArchetypeBridge.getOrCreateArchetype.bind(nodeSchemaArchetypeBridge);
        const nodeSchemaIndex = new FluidNodeSchemaIndex(
            getNodeSchemaBySymbol,
            getFluidArchetypeOfNodeSchema
        );

        const nodeManager = new FluidNodeManager(
            nodeRepository,
            nodeRepository,
            nodeFactory,
            nodeSchemaRegistry,
            getFluidArchetypeOfNodeSchema,
            nodeSchemaIndex
        );


        // Prepare Entity Manager
        const entityProxyFactory = new FluidEntityProxyFactory(
            componentRepository
        );
        const entityManager = new FluidEntityManager(
            new FluidEntityFactory(),
            entityProxyFactory
        );

        // Prepare System Orchestrator
        const systemOrchestrator = new FluidSystemOrchestrator();

        // Hook the component type factory into the component type registry for id-related logic on unregisteration of types.
        componentTypeRegistryHookDispatcher.addHook(componentTypeFactory);

        // Hook the entity archetype coordinator into the component repository to update entity archetypes upon
        // Addition/removal of components
        componentRepositoryHookDispatcher.addHook(entityArchetypeCoordinator);

        // Hook the schema index into the schema registry to update the index upon registration/deregistration of schemas
        nodeSchemaRegistryHookDispatcher.addHook(nodeSchemaIndex);

        // Hook the node manager into the entity archetype bridge to update nodes on changes in an entity's archetype.
        entityArchetypeHookDispatcher.addHook(nodeManager);


        const core = new FluidCore(
            entityManager,
            componentManager,
            systemOrchestrator,
            nodeManager
        );
        return core;
    }

    static isFluidCore(core: Core): core is FluidCore {
        return (core as any)[FLUID_CORE_SYMBOL] === true;
    }

    static {
        Object.defineProperty(FluidCore.prototype, FLUID_CORE_SYMBOL, {
            value: true,
            writable: false,
            enumerable: false,
            configurable: false,
        });
    }

    constructor(
        private entityManager: ECSEntityManager,
        private componentManager: ECSComponentManager,
        private systemOrchestrator: ECSSystemOrchestrator,
        private nodeManager: ECSNodeManager
    ) {
    }

    update(): void {
        this.systemOrchestrator.update(this.getNodeManager().getNodeIndex());
    }

    getEntityManager(): ECSEntityManager {
        return this.entityManager;
    }

    getComponentManager(): ECSComponentManager {
        return this.componentManager;
    }

    getSystemOrchestrator(): ECSSystemOrchestrator {
        return this.systemOrchestrator;
    }

    getNodeManager(): ECSNodeManager {
        return this.nodeManager;
    }
}

