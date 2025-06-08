import { FluidEngine } from "../engine/FluidEngine";
import { WorldContext } from "./world/World";

export class ClientContext {
    public displayColliders = true;
    constructor(public engineInstance: FluidEngine, public worldContext: WorldContext, public renderingContext: CanvasRenderingContext2D) { }

}