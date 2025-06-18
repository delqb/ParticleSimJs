import { FluidCore } from "./FluidECS";
import { FPSTimer } from "./lib/utils/FPSTimer";

export class FluidEngine extends FluidCore {
    private isAnimating = false;
    private gameTime = 0;
    public readonly fpsTimer: FPSTimer;
    constructor(public PIXELS_PER_METER: number = 1000, public deltaTime: number = 1 / 60, FPS_SAMPLING_INTERVAL: number = 20) {
        super();
        this.fpsTimer = new FPSTimer(FPS_SAMPLING_INTERVAL);
    }
    getFPS() {
        return this.fpsTimer.getFPS();
    }
    getGameTime() {
        return this.gameTime;
    }
    getDeltaTime() {
        return this.deltaTime;
    }
    animate() {
        try {
            this.fpsTimer.tick();
            this.update();
        } catch (err) {
            console.error(err);
        }
        if (this.isAnimating)
            requestAnimationFrame(this.animate.bind(this));
        this.gameTime += this.deltaTime;
    }
    getAnimationState() {
        return this.isAnimating;
    }
    startAnimation() {
        if (this.isAnimating)
            return;
        this.isAnimating = true;
        this.animate();
    }
    stopAnimation() {
        this.isAnimating = false;
    }
    toggleAnimation() {
        if (this.isAnimating)
            this.stopAnimation();
        else
            this.startAnimation();
    }
}