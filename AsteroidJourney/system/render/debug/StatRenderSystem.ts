import { EntityID, System, MathUtils, Vector2 } from "../../../../engine/FluidECS.js";
import { AccelerationComponent, PositionComponent, StatsComponent, VelocityComponent } from "../../../Components.js";
import { engine, CONTEXT, measuredFPS } from "../../../AsteroidJourney.js";
import { ClientContext } from "../../../Client.js";

const round = MathUtils.round;

function drawComplexText(x: number, y: number, content = [["Colored ", "red"], ["\n"], ["Text ", "Blue"], ["Test", "Green"]], lineSpacing = 2) {
    const TEXT_METRICS = CONTEXT.measureText("A");
    const FONT_HEIGHT = TEXT_METRICS.actualBoundingBoxAscent + TEXT_METRICS.actualBoundingBoxDescent;

    let xOrig = x;
    for (const piece of content) {
        let text = piece[0];
        let color = piece.length > 1 ? piece[1] : CONTEXT.fillStyle;
        CONTEXT.fillStyle = color;
        if (text.includes("\n")) {
            for (const line of text.split("\n")) {
                CONTEXT.fillText(line, x, y);
                y += FONT_HEIGHT + lineSpacing;
                x = xOrig;
            }
        }
        else {
            CONTEXT.fillText(text, x, y);
            x += CONTEXT.measureText(text).width;
        }
    }
    return y;
}

type StatRenderNode = {
    position: PositionComponent;
    velocity: VelocityComponent;
    acceleration: AccelerationComponent;
    stats: StatsComponent;
}

export class StatRenderSystem extends System<StatRenderNode> {
    NODE_COMPONENT_KEYS: Set<keyof StatRenderNode> = new Set(['stats', 'velocity', 'acceleration', 'position']);
    constructor(public clientContext: ClientContext) {
        super();
    }
    static STATS = {
        isAnimating: (node: StatRenderNode) => engine.getAnimationState(),
        fps: (node: StatRenderNode) => round(measuredFPS),
        position: (node: StatRenderNode) => {
            const pC = node.position;
            const { position: p, rotation: r } = pC;
            return `([${round(p.x)}, ${round(p.y)}] m) (${round(r)} rad)`
        },
        velocity: (node: StatRenderNode) => {
            const vC = node.velocity;
            const { velocity: v, angular: a } = vC;
            return `(${round(Vector2.magnitude(v))} m/s) (${round(a)} rad/s) ([${round(v.x)}, ${round(v.y)}] m/s)`
        },
        acceleration: (node: StatRenderNode) => {
            const aC = node.acceleration;
            const { acceleration: accel, angular: angl } = aC;
            return `(${round(Vector2.magnitude(accel))} m/s^2) (${round(angl)} rad/s^2) ([${round(accel.x)}, ${round(accel.y)}] m/s^2)`
        },
    }

    static formatStats(key: string, value: any) {
        return [`${key}: ${typeof value === "number" ? round(value) : value}\n`, "white"];
    }

    public updateNode(node: StatRenderNode, entityID: EntityID) {
        if (!this.clientContext.displayDebugInfo)
            return;

        drawComplexText(10, 10,
            Object.keys(StatRenderSystem.STATS).map((key) => StatRenderSystem.formatStats(key, StatRenderSystem.STATS[key](node))),
            2);
    }
}