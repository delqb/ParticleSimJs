import { Position } from "@asteroid/components/PositionComponent";
import { Projectile } from "@asteroid/components/ProjectileComponent";
import { Fluid } from "@fluid/Fluid";
import { FluidEngine } from "@fluid/FluidEngine";
import { FluidSystem } from "@fluid/impl/core/system/FluidSystem";
import { ECSNode } from "@fluid/core/node/Node";

const schema = {
    projectile: Projectile,
    position: Position
}
type Schema = typeof schema;
const nodeMeta = Fluid.registerNodeSchema(schema, "Projectile");

export class ProjectileSystem extends FluidSystem<Schema> {
    constructor(public engineInstance: FluidEngine) {
        super("Projectile System", nodeMeta);
    }
    public updateNode(node: ECSNode<Schema>): void {
        const eng = this.engineInstance;
        const GAME_TIME = eng.getGameTime();

        if (GAME_TIME >= node.projectile.deathTime) {
            Fluid.removeEntity(node.entityId);
        }
    }
}