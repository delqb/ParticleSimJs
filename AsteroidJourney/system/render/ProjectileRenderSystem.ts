import { EntityID, System, MathUtils } from "../../../engine/FluidECS.js";
import { ProjectileComponent, ParticleComponent, PositionComponent } from "../../Components.js";
import { engine, CONTEXT } from "../../AsteroidJourney.js";

type ProjectileRenderNode = {
    projectile: ProjectileComponent;
    particle: ParticleComponent;
    position: PositionComponent;
}

export class ProjectileRenderSystem extends System<ProjectileRenderNode> {
    NODE_COMPONENT_KEYS: Set<keyof ProjectileRenderNode> = new Set(['projectile', 'position', 'particle']);
    public updateNode(node: ProjectileRenderNode, entityID: EntityID) {
        const GAME_TIME = engine.getGameTime();
        const { x, y } = node.position.position;
        CONTEXT.save();
        let scale = 1;

        if (node.projectile.deathTime - GAME_TIME <= 1) {
            let X = (node.projectile.deathTime - GAME_TIME)
            CONTEXT.globalAlpha = MathUtils.lerp(0, Math.sin(1 / (0.01 + X / 10)), 1 - X);

            if (node.projectile.generation < 2)
                scale = MathUtils.lerp(1, 1.5, 1 - X);
            else
                scale = MathUtils.lerp(1, 0, 1 - X);
        }

        CONTEXT.beginPath();
        CONTEXT.arc(x, y, scale * node.particle.radius, 0, 2 * Math.PI);
        CONTEXT.fillStyle = node.particle.color;
        CONTEXT.fill();

        CONTEXT.restore();
    }
}