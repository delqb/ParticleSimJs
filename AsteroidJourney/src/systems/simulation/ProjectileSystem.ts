import { ProjectileComponent } from "@asteroid/components";
import { PositionComponent } from "@asteroid/components/PositionComponent";
import { EntityID, System } from "@fluidengine/core";
import { FluidEngine } from "@fluidengine/FluidEngine";

type ProjectileSystemNode = {
    projectile: ProjectileComponent;
    position: PositionComponent;
}

export class ProjectileSystem extends System<ProjectileSystemNode> {
    NODE_COMPONENT_KEYS: Set<keyof ProjectileSystemNode> = new Set(['projectile', 'position']);
    constructor(public engineInstance: FluidEngine) {
        super();
    }
    public updateNode(node: ProjectileSystemNode, entityID: EntityID) {
        const eng = this.engineInstance;
        const GAME_TIME = eng.getGameTime();

        if (GAME_TIME >= node.projectile.deathTime) {
            eng.removeEntity(entityID);
        }
    }
}