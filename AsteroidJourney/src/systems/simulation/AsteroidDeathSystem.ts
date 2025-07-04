import { asteroidImage, createSpriteEntity } from "@asteroid/AsteroidJourney";
import { ClientContext } from "@asteroid/client/Client";
import { Asteroid, AsteroidComponent } from "@asteroid/components/AsteroidComponent";
import { EntityDeath, EntityDeathComponent } from "@asteroid/components/EntityDeathComponent";
import { LifeTime } from "@asteroid/components/LifetimeComponent";
import { Particle } from "@asteroid/components/ParticleComponent";
import { Position } from "@asteroid/components/PositionComponent";
import { Velocity } from "@asteroid/components/VelocityComponent";
import { ECSComponentType } from "@fluid/core/component/type/ComponentType";
import { ECSNode } from "@fluid/core/node/Node";
import { Fluid } from "@fluid/Fluid";
import { FluidSystem } from "@fluid/impl/core/system/FluidSystem";
import { Vec2, Vector2 } from "@fluid/lib/spatial/Vector2";

const schema = {
    position: Position,
    velocity: Velocity,
    asteroid: Asteroid,
    entityDeath: EntityDeath,
}

type Schema = typeof schema;
const nodeMeta = Fluid.registerNodeSchema(schema, "Asteroid Death");

function createAsteroidParticle(position: Vec2, rotation: number, velocity: Vec2, angularVelocity: number, spawnTime: number, lifeDuration: number, size: number) {
    const entityId = createSpriteEntity(position, rotation, asteroidImage, 3, size / asteroidImage.width);
    Fluid.addEntityComponents(entityId,
        Velocity.createComponent({ velocity: velocity, angular: angularVelocity }),
        LifeTime.createComponent({ lifeDuration, spawnTime }),
        Particle.createComponent({})
    )
}

const explosionIntensityScale = 0.5;

export class AsteroidDeathSystem extends FluidSystem<Schema> {
    constructor(
        public clientContext: ClientContext
    ) {
        super("Asteroid Death System", nodeMeta);
    }

    updateNode(node: ECSNode<Schema>): void {
        const { asteroid, entityDeath, position, velocity, entityId } = node;
        const { size } = asteroid;
        const count = size * 10 * 5;
        const increment = 2 * Math.PI / count;
        if (entityDeath.readyToRemove) {
            Fluid.removeEntity(entityId);
            return;
        }
        for (let angle = 0; angle < 2 * Math.PI; angle += increment) {
            let vX = Math.cos(angle) * (0.5 + 0.65 * Math.random());
            let vY = Math.sin(angle) * (0.5 + 0.65 * Math.random());
            createAsteroidParticle(
                Vector2.copy(position.position),
                position.rotation + angle,
                Vector2.add(velocity.velocity, Vector2.scale({ x: vX, y: vY }, explosionIntensityScale)),
                velocity.angular + 1.2 * Math.PI * Math.random(),
                this.clientContext.engineInstance.getGameTime(),
                5,
                (0.3 + 0.8 * Math.random() / count) * asteroid.size
            );
        }
        entityDeath.readyToRemove = true;
    }
}