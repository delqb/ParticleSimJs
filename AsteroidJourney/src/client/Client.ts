import {FluidEngine} from "@fluidengine/FluidEngine";
import {WorldContext} from "../world/World";
import {CanvasRenderer} from "./renderer/Renderer";

export class ClientContext {
    public displayBoundingBoxes = false;
    public displayEntityAxes = false;
    public displayDebugInfo = false;
    public displayChunks = false;
    constructor(public engineInstance: FluidEngine, public worldContext: WorldContext, public renderer: CanvasRenderer) { }

    setZoomLevel(level: number) {
        this.engineInstance.PIXELS_PER_METER = 10 * level;
    }
    getZoomLevel(): number {
        return this.engineInstance.PIXELS_PER_METER / 10;
    }

    getSimulationSpeed() {
        return this.engineInstance.deltaTime * 60;
    }

    setSimulationSpeed(speed: number) {
        this.engineInstance.deltaTime = speed / 60;
    }
}