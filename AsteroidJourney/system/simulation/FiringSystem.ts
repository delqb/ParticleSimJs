import { engine } from "../../AsteroidJourney.js";
import { EntityID, System, Vector2 } from "../../../engine/FluidECS.js";
import { PositionComponent, VelocityComponent, WorldComponent, ProjectileSourceComponent, FireControlComponent, TargetPositionComponent } from "../../Components.js";
import { PARTICLE_PARAMETERS, SHIP_PARAMETERS, spawnProjectile } from "../../AsteroidJourney.js";

type FiringSystemNode = {
    world: WorldComponent;
    projectileSource: ProjectileSourceComponent;
    fireControl: FireControlComponent;
    targetPosition: TargetPositionComponent;
    velocity: VelocityComponent;
    position: PositionComponent;
}

export class FiringSystem extends System<FiringSystemNode> {
    NODE_COMPONENT_KEYS: Set<keyof FiringSystemNode> = new Set(['world', 'projectileSource', 'fireControl', 'targetPosition', 'velocity', 'position']);
    public updateNode(node: FiringSystemNode, entityID: EntityID) {
        const GAME_TIME = engine.getGameTime();
        if (!node.fireControl.fireIntent)
            return;

        node.fireControl.fireIntent = false;

        if (GAME_TIME - node.projectileSource.lastFireTime < 1 / PARTICLE_PARAMETERS.projectile.fireRate)
            return

        let direction = { x: Math.cos(node.position.rotation), y: Math.sin(node.position.rotation) },
            position = Vector2.add(node.position.position, Vector2.scale(direction, SHIP_PARAMETERS.bowLength)),
            velocity = Vector2.add(Vector2.scale(direction, node.projectileSource.muzzleSpeed), node.velocity.velocity);

        spawnProjectile(
            node.world,
            position,
            -node.position.rotation,
            velocity,
            GAME_TIME + PARTICLE_PARAMETERS.projectile.lifetime,
            1,
            node.projectileSource.projectileScale
        );
        node.projectileSource.lastFireTime = GAME_TIME;
    }
}

