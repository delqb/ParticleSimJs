import {ECSNodeFactory} from "./NodeFactory";
import {ECSNodeIndex} from "./NodeIndex";
import {ECSNodeRepository} from "./NodeRepository";
import {ECSNodeSchemaRegistry} from "./schema/NodeSchemaRegistry";

export interface ECSNodeManager {
    getNodeRepository(): ECSNodeRepository;
    getNodeFactory(): ECSNodeFactory;
    getNodeSchemaRegistry(): ECSNodeSchemaRegistry;
    getNodeIndex(): ECSNodeIndex;
}