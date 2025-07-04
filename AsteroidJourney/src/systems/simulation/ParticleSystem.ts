import { ClientContext } from "@asteroid/client/Client";
import { LifeTime, LifeTimeComponent } from "@asteroid/components/LifetimeComponent";
import { Particle } from "@asteroid/components/ParticleComponent";
import { Position, PositionComponent } from "@asteroid/components/PositionComponent";
import { ECSNode } from "@fluid/core/node/Node";
import { Fluid } from "@fluid/Fluid";
import { FluidSystem } from "@fluid/impl/core/system/FluidSystem";

const schema = {
    particle: Particle,
    lifetime: LifeTime
}
type Schema = typeof schema;
const nodeMeta = Fluid.registerNodeSchema(schema, "Particle Render System");

export class ParticleSystem extends FluidSystem<Schema> {
    constructor(public clientContext: ClientContext) {
        super("Particle Render System", nodeMeta);
    }

    updateNode(node: ECSNode<Schema>): void {
        const { entityId, lifetime } = node;
        const { lifeDuration, spawnTime } = lifetime;
        const deathTime = spawnTime + lifeDuration;
        if (this.clientContext.engineInstance.getGameTime() >= deathTime)
            Fluid.removeEntity(entityId);
    }
}