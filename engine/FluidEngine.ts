import { FluidCore } from "./FluidECS.js";

export class FluidEngine extends FluidCore {
    private isAnimating = false;
    private gameTime = 0;
    constructor(public readonly PIXELS_PER_METER: number = 1000, public readonly deltaTime: number = 1 / 60) {
        super();
    }
    getGameTime() {
        return this.gameTime;
    }
    getDeltaTime() {
        return this.deltaTime;
    }
    animate() {
        this.update();
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