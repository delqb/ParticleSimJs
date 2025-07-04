import { EntityDeath, EntityDeathComponent } from "@asteroid/components/EntityDeathComponent";
import { ECSComponentType } from "@fluid/core/component/type/ComponentType";
import { ECSNode } from "@fluid/core/node/Node";
import { Fluid } from "@fluid/Fluid";
import { FluidSystem } from "@fluid/impl/core/system/FluidSystem";

const schema = {
    entityDeath: EntityDeath
}
type Schema = typeof schema;
const nodeMeta = Fluid.registerNodeSchema(schema, "Entity Death");

export class EntityDeathSystem extends FluidSystem<Schema> {
    updateNode(node: ECSNode<Schema>): void {
        if (node.entityDeath.readyToRemove)
            Fluid.removeEntity(node.entityId);
    }
}