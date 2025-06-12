import { engine } from "../../AsteroidJourney.js";
import { EntityID, System, MathUtils } from "../../../engine/FluidECS.js";
import { PositionComponent, VelocityComponent } from "../../Components.js";

const PI = Math.PI, PI2 = 2 * PI;

export type PositionSystemNode = {
    position: PositionComponent;
    velocity: VelocityComponent;
}

export class PositionSystem extends System<PositionSystemNode> {
    NODE_COMPONENT_KEYS: Set<keyof PositionSystemNode> = new Set(['position', 'velocity']);
    public updateNode(node: PositionSystemNode, entityID: EntityID) {
        const DELTA_TIME = engine.getDeltaTime();
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