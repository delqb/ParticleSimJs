import {ECSNode} from "../node/Node";
import {ECSNodeSchema} from "../node/schema/NodeSchema";
import {ECSSystemMeta} from "./SystemMeta";

export interface ECSSystem<S extends ECSNodeSchema> {
    getSystemMeta(): ECSSystemMeta;
    updateNodes(nodes: Iterable<ECSNode<S>>): void;
}