import { ClientContext } from "@asteroid/client/Client";
import { Acceleration } from "@asteroid/components/AccelerationComponent";
import { Position } from "@asteroid/components/PositionComponent";
import { Stats } from "@asteroid/components/StatsComponent";
import { Velocity } from "@asteroid/components/VelocityComponent";
import { ECSNode } from "@fluid/core/node/Node";
import { Fluid } from "@fluid/Fluid";
import { FluidSystem } from "@fluid/impl/core/system/FluidSystem";
import { Vector2 } from "@fluid/lib/spatial/Vector2";
import * as MathUtils from "@fluid/lib/utils/MathUtils";

const round = MathUtils.round;

function drawComplexText(renderContext: CanvasRenderingContext2D, x: number, y: number, content = [["Colored ", "red"], ["\n"], ["Text ", "Blue"], ["Test", "Green"]], lineSpacing = 2) {
    const TEXT_METRICS = renderContext.measureText("A");
    const FONT_HEIGHT = TEXT_METRICS.actualBoundingBoxAscent + TEXT_METRICS.actualBoundingBoxDescent;

    let xOrig = x;
    for (const piece of content) {
        let text = piece[0];
        let color = piece.length > 1 ? piece[1] : renderContext.fillStyle;
        renderContext.fillStyle = color;
        if (text.includes("\n")) {
            for (const line of text.split("\n")) {
                renderContext.fillText(line, x, y);
                y += FONT_HEIGHT + lineSpacing;
                x = xOrig;
            }
        }
        else {
            renderContext.fillText(text, x, y);
            x += renderContext.measureText(text).width;
        }
    }
    return y;
}

const schema = {
    position: Position,
    velocity: Velocity,
    acceleration: Acceleration,
    stats: Stats
}
type Schema = typeof schema;
const nodeMeta = Fluid.registerNodeSchema(schema, "Debug Info Display");

export class DebugInfoDisplaySystem extends FluidSystem<Schema> {
    constructor(
        public clientContext: ClientContext
    ) {
        super("Debug Info Display System", nodeMeta);
    }
    stats = {
        isAnimating: (node: ECSNode<Schema>) => this.clientContext.engineInstance.getAnimationState(),
        fps: (node: ECSNode<Schema>) => round(this.clientContext.engineInstance.getFPS()),
        position: (node: ECSNode<Schema>) => {
            const pC = node.position;
            const { position: p, rotation: r } = pC;
            return `([${round(p.x)}, ${round(p.y)}] m) (${round(r)} rad)`
        },
        velocity: (node: ECSNode<Schema>) => {
            const vC = node.velocity;
            const { velocity: v, angular: a } = vC;
            return `(${round(Vector2.magnitude(v))} m/s) (${round(a)} rad/s) ([${round(v.x)}, ${round(v.y)}] m/s)`
        },
        acceleration: (node: ECSNode<Schema>) => {
            const aC = node.acceleration;
            const { acceleration: accel, angular: angl } = aC;
            return `(${round(Vector2.magnitude(accel))} m/s^2) (${round(angl)} rad/s^2) ([${round(accel.x)}, ${round(accel.y)}] m/s^2)`
        },
        zoom: () => {
            return `%${round(this.clientContext.getZoomLevel())}`;
        },
        time: () => {
            return `x${round(this.clientContext.getSimulationSpeed(), 5)}`;
        }
    }

    static formatStats(key: string, value: any) {
        return [`${key}: ${typeof value === "number" ? round(value) : value}\n`, "white"];
    }

    public updateNode(node: ECSNode<Schema>) {
        const cc = this.clientContext, stats = this.stats;
        if (!cc.displayDebugInfo)
            return;

        drawComplexText(cc.renderer.renderContext, 10, 10,
            Object.keys(stats).map(
                (key) => DebugInfoDisplaySystem.formatStats(key, stats[key](node))
            )
            , 2);
    }
}