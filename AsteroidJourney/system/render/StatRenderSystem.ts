import { EntityID, System, MathUtils } from "../../../engine/FluidECS.js";
import { AccelerationComponent, PositionComponent, StatsComponent, VelocityComponent } from "../../Components.js";
import { engine, CONTEXT, measuredFPS } from "../../AsteroidJourney.js";


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
    private isStatsVisible = true;
    static STATS = {
        isAnimating: (node: StatRenderNode) => engine.getAnimationState(),
        fps: (node: StatRenderNode) => MathUtils.round(measuredFPS),
        position: (node: StatRenderNode) => `${MathUtils.round(node.position.position.x)}, ${MathUtils.round(node.position.position.y)}`,
        velocity: (node: StatRenderNode) => `${MathUtils.round(node.stats.computedSpeed)} (${MathUtils.round(node.velocity.velocity.x)}, ${MathUtils.round(node.velocity.velocity.y)})`,
        acceleration: (node: StatRenderNode) => `${MathUtils.round(node.stats.computedAcceleration)} (${MathUtils.round(node.acceleration.acceleration.x)}, ${MathUtils.round(node.acceleration.acceleration.y)})`,
    }

    static formatStats(key: string, value: any) {
        return [`${key}: ${typeof value === "number" ? MathUtils.round(value) : value}\n`, "white"];
    }

    toggleStats() {
        this.isStatsVisible = !this.isStatsVisible;
    }

    setStatsVisible(visible: boolean) {
        this.isStatsVisible = visible;
    }

    public updateNode(node: StatRenderNode, entityID: EntityID) {
        if (!this.isStatsVisible)
            return;
        drawComplexText(10, 10,
            Object.keys(StatRenderSystem.STATS).map((key) => StatRenderSystem.formatStats(key, StatRenderSystem.STATS[key](node))),
            2);
    }
}