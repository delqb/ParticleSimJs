import { engine } from "../../AsteroidJourney.js";
import { EntityID, System } from "../../../engine/FluidECS.js";
import { PositionComponent, VelocityComponent, ParticleComponent, WorldComponent } from "../../Components.js";

export type CollisionSystemNode = {
    position: PositionComponent;
    velocity: VelocityComponent;
    particle: ParticleComponent;
    world: WorldComponent;
}

export class CollisionSystem extends System<CollisionSystemNode> {
    NODE_COMPONENT_KEYS: Set<keyof CollisionSystemNode> = new Set(['particle', 'position', 'velocity', 'world']);
    public updateNode(node: CollisionSystemNode, entityID: EntityID) {
        const DELTA_TIME = engine.getDeltaTime();
        let { position, velocity, particle, world } = node;
        let particleRadius = particle.radius;
        let { x, y } = position.position;
        let { x: vX, y: vY } = velocity.velocity;


        const worldWidth = world.resolution.x,
            worldHeight = world.resolution.y,
            worldCenterX = worldWidth / 2,
            worldCenterY = worldHeight / 2,
            diffX = worldCenterX - x,
            diffY = worldCenterY - y,
            distanceX = Math.abs(diffX),
            distanceY = Math.abs(diffY),
            distanceXMax = worldWidth / 2 - particleRadius,
            distanceYMax = worldHeight / 2 - particleRadius,
            penetrationCorrectionThreshold = world.borderWidth,
            penetrationDistanceX = distanceXMax + penetrationCorrectionThreshold,
            penetrationDistanceY = distanceYMax + penetrationCorrectionThreshold;

        if (distanceX > distanceXMax) {
            let direction = Math.sign(diffX);
            velocity.velocity.x = direction * (Math.abs(vX) + +(distanceX > penetrationDistanceX) * DELTA_TIME * distanceX / penetrationDistanceX);
        }

        if (distanceY > distanceYMax) {
            let direction = Math.sign(diffY);
            velocity.velocity.y = direction * (Math.abs(vY) + +(distanceY > penetrationDistanceY) * DELTA_TIME * distanceY / penetrationDistanceY);
        }
    }
}