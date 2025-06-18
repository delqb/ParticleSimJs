import {
    FireControlComponent,
    PositionComponent,
    ProjectileSourceComponent,
    VelocityComponent
} from "@asteroid/components";
import {EntityID, System} from "@fluidengine/core";
import {FluidEngine} from "@fluidengine/FluidEngine";
import {Vec2} from "@fluidengine/lib/spatial";

type FiringSystemNode = {
    projectileSource: ProjectileSourceComponent;
    fireControl: FireControlComponent;
    velocity: VelocityComponent;
    position: PositionComponent;
}

export interface ProjectileSpawnParams {
    position: Vec2;
    velocity: Vec2;
    rotation: number;
    angularVelocity: number;
    deathTime: number;
    generation: number;
    size: number;
}

export type ProjectileSpawnFunction = (params: ProjectileSpawnParams) => EntityID | undefined;


export class FiringSystem extends System<FiringSystemNode> {
    NODE_COMPONENT_KEYS: Set<keyof FiringSystemNode> = new Set(['projectileSource', 'fireControl', 'velocity', 'position']);
    constructor(public engineInstance: FluidEngine, public spawnProjectile: ProjectileSpawnFunction) {
        super()
    }

    public updateNode(node: FiringSystemNode, entityID: EntityID) {
        const GAME_TIME = this.engineInstance.getGameTime();
        const { fireControl, projectileSource, position: positionComponent, velocity: velocityComponent } = node;
        let { position: pos, rotation: rot } = positionComponent;
        const velocity = velocityComponent.velocity;
        const { muzzleSpeed, projectileLifeTime, projectileSize } = projectileSource;
        const transform = projectileSource.transform;
        if (!(muzzleSpeed && projectileLifeTime && projectileSize))
            throw new Error("Projectile source parameters are not defined.");

        if (!fireControl.fireIntent)
            return;

        if (GAME_TIME - projectileSource.lastFireTime < 1 / projectileSource.fireRate)
            return

        if (transform?.rotate !== undefined)
            rot += transform.rotate;

        const directionX = Math.cos(rot),
            directionY = Math.sin(rot);

        const step = transform?.scale || 0;

        let pX = pos.x,
            pY = pos.y;

        const translate = transform?.translate;
        if (translate) {
            pX += translate.x;
            pY += translate.y;
        }

        const projectilePosition = { x: pX + directionX * step, y: pY + directionY * step };
        const projectileVelocity = { x: velocity.x + directionX * muzzleSpeed, y: velocity.y + directionY * muzzleSpeed };

        const spID = this.spawnProjectile({
            position: projectilePosition,
            velocity: projectileVelocity,
            rotation: rot,
            angularVelocity: 0,
            deathTime: GAME_TIME + projectileLifeTime,
            generation: 1,
            size: projectileSize
        })

        if (!spID)
            console.warn("Failed to spawn projectile!");

        projectileSource.lastFireTime = GAME_TIME;
    }
}

