import { FluidEngine } from "@fluidengine/FluidEngine";
import { WorldContext } from "../world/World";
import { CanvasRenderer } from "./renderer/Renderer";

export class ClientContext {
    public displayBoundingBoxes = false;
    public displayEntityAxes = false;
    public displayDebugInfo = false;
    constructor(public engineInstance: FluidEngine, public worldContext: WorldContext, public renderer: CanvasRenderer) { }

}