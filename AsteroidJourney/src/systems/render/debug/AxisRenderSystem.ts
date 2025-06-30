import { ClientContext } from "@asteroid/client/Client";
import { Position } from "@asteroid/components/PositionComponent";
import { BoundingBox } from "@asteroid/components/BoundingBoxComponent";
import { Fluid } from "@fluid/Fluid";
import { FluidSystem } from "@fluid/impl/core/system/FluidSystem";
import { ECSNode } from "@fluid/core/node/Node";

const PI = Math.PI, PI2 = 2 * PI;

const backgroundOverlayRenderColor = "black";
const backgroundOverlayAlpha = 0.7;

const alignedAxisScaleFactor = 1.5;
const alignedAxisThicknessFactor = 2;
const alignedAxisRenderColor = "white";

const orientedAxisScaleFactor = 1.2;
const orientedAxisThicknessFactor = 1.25;
const orientedAxisRenderColor = "red";

const rotationAngleArcRadiusFactor = 0.25;
const rotationAngleArcColor = "yellow";

const nodeMeta = Fluid.registerNodeSchema(
    {
        position: Position,
        boundingBox: BoundingBox
    },
    "Axis Render"
);
type Schema = typeof nodeMeta.schema;

export class AxisRenderSystem extends FluidSystem<Schema> {
    constructor(
        public clientContext: ClientContext
    ) {
        super("Axis Render System", nodeMeta);
    }

    updateNode(node: ECSNode<Schema>): void {
        if (!this.clientContext.displayEntityAxes)
            return;

        const { position: ePos, rotation: eRot } = node.position;
        const { size: bbRect, transform: bbTransform } = node.boundingBox;
        const width = bbRect.width,
            height = bbRect.height;

        const ctx = this.clientContext.renderer.renderContext;
        const PPM = this.clientContext.engineInstance.PIXELS_PER_METER;
        let rot = eRot, rotOffset = 0;

        ctx.save();

        // Translate what follows to entity position
        ctx.translate(ePos.x, ePos.y);
        if (bbTransform) {
            const bbTranslate = bbTransform.translate,
                bbScale = bbTransform.scale,
                bbRot = bbTransform.rotate;
            if (bbTranslate) ctx.translate(bbTranslate.x, bbTranslate.y);
            if (bbScale) ctx.scale(bbScale, bbScale);
            if (bbRot) {
                rotOffset = bbRot;
            };
        }

        const length = Math.max(width, height) / 2;

        // Draw background overlay
        ctx.globalAlpha = backgroundOverlayAlpha;
        ctx.beginPath();
        ctx.arc(0, 0, length, 0, PI2);
        ctx.fillStyle = backgroundOverlayRenderColor;
        ctx.fill();
        ctx.globalAlpha = 1.0;


        // Draw axis-aligned lines
        const axisAlignedLength = alignedAxisScaleFactor * length;
        ctx.strokeStyle = alignedAxisRenderColor;
        ctx.lineWidth = alignedAxisThicknessFactor / PPM;
        ctx.beginPath();
        ctx.moveTo(-axisAlignedLength, 0);
        ctx.lineTo(axisAlignedLength, 0);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, -axisAlignedLength);
        ctx.lineTo(0, axisAlignedLength);
        ctx.stroke();

        // Draw rotation angle arc
        ctx.lineWidth = orientedAxisThicknessFactor / PPM;
        ctx.strokeStyle = rotationAngleArcColor;
        ctx.beginPath();
        ctx.arc(0, 0, rotationAngleArcRadiusFactor * length, rotOffset, rot + rotOffset, rot < 0);
        ctx.stroke();


        // Rotate what follows to match entity's rotation
        ctx.rotate(rot);


        // Draw oriented axis lines
        const orientedAxisLength = orientedAxisScaleFactor * length;
        ctx.strokeStyle = orientedAxisRenderColor;
        ctx.beginPath();
        ctx.moveTo(-orientedAxisLength, 0);
        ctx.lineTo(orientedAxisLength, 0);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, -orientedAxisLength);
        ctx.lineTo(0, orientedAxisLength);
        ctx.stroke();


        ctx.restore();
    }
}