import { engine, PARTICLE_PARAMETERS, SHIP_PARAMETERS, spawnProjectile } from "@asteroid/AsteroidJourney";
import { ProjectileSourceComponent, FireControlComponent, VelocityComponent, PositionComponent } from "@asteroid/components";
import { System, EntityID } from "@fluidengine/core";
import { Vector2 } from "@fluidengine/lib/spatial";

type FiringSystemNode = {
    projectileSource: ProjectileSourceComponent;
    fireControl: FireControlComponent;
    velocity: VelocityComponent;
    position: PositionComponent;
}

export class FiringSystem extends System<FiringSystemNode> {
    NODE_COMPONENT_KEYS: Set<keyof FiringSystemNode> = new Set(['projectileSource', 'fireControl', 'velocity', 'position']);
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
            position,
            node.position.rotation,
            velocity,
            GAME_TIME + PARTICLE_PARAMETERS.projectile.lifetime,
            1,
            node.projectileSource.projectileSize
        );
        node.projectileSource.lastFireTime = GAME_TIME;
    }
}

