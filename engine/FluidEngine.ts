import { FluidCore } from "./FluidECS.js";

export class FluidEngine extends FluidCore {
    private isAnimating = false;
    private gameTime = 0;
    private deltaTime = 1 / 60;
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