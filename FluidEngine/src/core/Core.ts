import { ECSComponentManager } from "./component/ComponentManager";
import { ECSEntityManager } from "./entity/EntityManager";
import { ECSNodeManager } from "./node/NodeManager";
import { ECSSystemOrchestrator } from "./system/SystemOrchestrator";

export interface Core {
    getEntityManager(): ECSEntityManager;
    getComponentManager(): ECSComponentManager;
    getSystemOrchestrator(): ECSSystemOrchestrator;
    getNodeManager(): ECSNodeManager;
    update(): void;
}