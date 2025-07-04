import { Velocity } from "@asteroid/components/VelocityComponent";
import { Position } from "@asteroid/components/PositionComponent";
import { Fluid } from "@fluid/Fluid";
import { FluidEngine } from "@fluid/FluidEngine";
import { FluidSystem } from "@fluid/impl/core/system/FluidSystem";
import { ECSNode } from "@fluid/core/node/Node";

const PI = Math.PI, PI2 = 2 * PI;

const schema = {
    position: Position,
    velocity: Velocity
}
type Schema = typeof schema;
const nodeMeta = Fluid.registerNodeSchema(schema, "Position");

export class PositionSystem extends FluidSystem<Schema> {
    constructor(public engineInstance: FluidEngine) {
        super("Position System", nodeMeta);
    }
    public updateNode(node: ECSNode<Schema>): void {
        const DELTA_TIME = this.engineInstance.deltaTime;
        const { position: posComp, velocity: velComp } = node;
        const { position: pos } = posComp;
        const { velocity: vel, angular: angVel } = velComp;
        let rot = posComp.rotation;

        pos.x += vel.x * DELTA_TIME;
        pos.y += vel.y * DELTA_TIME;
        rot += angVel * DELTA_TIME;

        if (rot >= PI)
            rot -= PI2;
        if (rot < -PI)
            rot += PI2;

        posComp.rotation = rot;
    }
}