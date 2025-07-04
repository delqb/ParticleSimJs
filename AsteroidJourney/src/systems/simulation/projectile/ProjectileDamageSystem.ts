import { Collision, CollisionComponent } from "@asteroid/components/CollisionComponent";
import { EntityDeath } from "@asteroid/components/EntityDeathComponent";
import { Health } from "@asteroid/components/HealthComponent";
import { Projectile, ProjectileComponent } from "@asteroid/components/ProjectileComponent";
import { ECSNode } from "@fluid/core/node/Node";
import { Fluid } from "@fluid/Fluid";
import { FluidSystem } from "@fluid/impl/core/system/FluidSystem";

const schema = {
    projectile: Projectile,
    collision: Collision
}

type Schema = typeof schema;

const nodeMeta = Fluid.registerNodeSchema(schema, "Projectile Damage");

export class ProjectileDamageSystem extends FluidSystem<Schema> {
    constructor() {
        super("Projectile Damage System", nodeMeta);
    }

    updateNode(node: ECSNode<Schema>): void {
        const { collision, entityId, projectile: projectileData } = node;
        const otherEntity = Fluid.getEntityProxy(collision.collidedEntity);

        if (!otherEntity.hasComponent(Health))
            return;

        const healthData = otherEntity.getComponent(Health).data;
        const health = Math.max(0, healthData.currentHealth - projectileData.damage);
        healthData.currentHealth = health;
        if (health === 0)
            if (!otherEntity.hasComponent(EntityDeath))
                otherEntity.addComponent(EntityDeath.createComponent({ readyToRemove: false }));

        Fluid.removeEntity(entityId);
    }
}