import { FluidEngine } from "@fluidengine/FluidEngine";
import { WorldContext } from "./world/World";

export class ClientContext {
    public displayBoundingBoxes = false;
    public displayEntityAxes = false;
    public displayDebugInfo = false;
    constructor(public engineInstance: FluidEngine, public worldContext: WorldContext, public renderingContext: CanvasRenderingContext2D) { }

}