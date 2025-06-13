import { engine, destroyProjectile } from "@asteroid/AsteroidJourney";
import { ProjectileComponent, PositionComponent } from "@asteroid/components";
import { System, EntityID } from "@fluidengine/core";

type ProjectileSystemNode = {
    projectile: ProjectileComponent;
    position: PositionComponent;
}

export class ProjectileSystem extends System<ProjectileSystemNode> {
    NODE_COMPONENT_KEYS: Set<keyof ProjectileSystemNode> = new Set(['projectile', 'position']);
    public updateNode(node: ProjectileSystemNode, entityID: EntityID) {
        const GAME_TIME = engine.getGameTime();

        if (GAME_TIME >= node.projectile.deathTime) {
            destroyProjectile(entityID);
            // if (node.projectile.generation == 2)
            //     return;
            // for (let i = 0; i < 2 * Math.PI; i += (2 * Math.PI / 9)) {
            //     let vX = Math.cos(i) * (0.5 + 0.65 * Math.random());
            //     let vY = Math.sin(i) * (0.5 + 0.65 * Math.random());
            //     spawnProjectile(
            //         node.world,
            //         Vector2.copy(node.position.position),
            //         Vector2.scale({ x: vX, y: vY }, MAX_SPEED),
            //         node.particle.color,
            //         node.particle.radius * PARTICLE_PARAMETERS.projectile.radius / PARTICLE_PARAMETERS.radius,
            //         GAME_TIME + PARTICLE_PARAMETERS.projectile.lifetime,
            //         node.projectile.generation + 1
            //     );
            // }
        }
    }
}