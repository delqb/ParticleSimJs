import { ClientContext } from "@asteroid/client/Client";
import { Viewport } from "@asteroid/components/ViewportComponent";
import { CameraSpeedFactor } from "@asteroid/components/CameraSpeedFactorComponent";
import { TargetPosition } from "@asteroid/components/TargetPositionComponent";
import { Position } from "@asteroid/components/PositionComponent";
import { Resolution } from "@asteroid/components/ResolutionComponent";
import { Vector2 } from "@fluid/lib/spatial/Vector2";
import { FluidSystem } from "@fluid/impl/core/system/FluidSystem";
import { Fluid } from "@fluid/Fluid";
import { ECSNode } from "@fluid/core/node/Node";
import { shortestAngleDiff } from "@fluid/lib/utils/MathUtils";

const schema = {
    position: Position,
    resolution: Resolution,
    targetPosition: TargetPosition,
    speedFactor: CameraSpeedFactor,
    viewport: Viewport
}
type Schema = typeof schema;
const nodeMeta = Fluid.registerNodeSchema(schema, "Viewport");

export class ViewportSystem extends FluidSystem<Schema> {
    constructor(public clientContext: ClientContext) {
        super("Viewport System", nodeMeta);
    }
    public updateNode(node: ECSNode<Schema>): void {
        const eng = this.clientContext.engineInstance;
        const DELTA_TIME = eng.getDeltaTime();
        const PPM = eng.PIXELS_PER_METER;
        const { position: positionComp, targetPosition: targetPositionComp, speedFactor: speedFactorComp, resolution: resolutionComp } = node;
        const { position: pos, rotation: rot } = positionComp;
        const { position: tPos, rotation: tRot } = targetPositionComp.position
        const vpRes = resolutionComp.resolution;
        const step = speedFactorComp.speedFactor * DELTA_TIME;

        const centerPos = Vector2.add(pos, { x: vpRes.x / (2 * PPM), y: vpRes.y / (2 * PPM) }); //World coordinates of viewport center
        const diff = Vector2.subtract(tPos, centerPos);
        const dist = Vector2.abs(diff);
        const moveDir = Vector2.normalize(diff);

        if (dist.x > 0 || dist.y > 0) {
            const moveVec = Vector2.multiply(moveDir, dist); // move proportional to how much target exceeded deadzone
            const stepVec = Vector2.scale(moveVec, step);
            positionComp.position = Vector2.add(pos, stepVec);
        }

        if (rot != tRot) {
            const angleDiff = shortestAngleDiff(rot, tRot);
            positionComp.rotation = rot + angleDiff * step;
        }
    }
}