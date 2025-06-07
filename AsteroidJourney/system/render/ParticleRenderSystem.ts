import { EntityID, System } from "../../../engine/FluidECS.js";
import { ParticleComponent, PositionComponent, TargetPositionComponent } from "../../Components.js";
import { PARTICLE_PARAMETERS, SHIP_PARAMETERS, CONTEXT } from "../../AsteroidJourney.js";

type ParticleRenderNode = {
    particle: ParticleComponent;
    position: PositionComponent;
}

export class ParticleRenderSystem extends System<ParticleRenderNode> {
    NODE_COMPONENT_KEYS: Set<keyof ParticleRenderNode> = new Set(['particle', 'position']);
    public updateNode(node: ParticleRenderNode, entityID: EntityID) {
        const { x: pX, y: pY } = node.position.position;
        const pSize = node.particle.radius / PARTICLE_PARAMETERS.radius;
        const width = SHIP_PARAMETERS.width * pSize, hW = width / 2;
        const length = SHIP_PARAMETERS.bowLength * pSize;

        CONTEXT.save();

        CONTEXT.translate(pX, pY);

        CONTEXT.save();

        CONTEXT.rotate(node.position.rotation);
        CONTEXT.beginPath();

        CONTEXT.moveTo(length, 0);
        CONTEXT.lineTo(0, -hW);
        CONTEXT.lineTo(-hW, 0);
        CONTEXT.lineTo(0, hW);

        CONTEXT.fillStyle = "gray";
        CONTEXT.fill();

        CONTEXT.restore();

        CONTEXT.beginPath();
        CONTEXT.arc(0, 0, node.particle.radius, 0, 2 * Math.PI);
        CONTEXT.fillStyle = node.particle.color;
        CONTEXT.fill();

        CONTEXT.restore();
    }
}