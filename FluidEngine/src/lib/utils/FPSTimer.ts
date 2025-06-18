export class FPSTimer {
    private previousSampleTimestamp = 0;
    private frameCountSinceSample = 0
    private currentFPS = 0;
    constructor(public readonly FRAME_SAMPLING_INTERVAL = 20) { }
    public tick() {
        this.frameCountSinceSample++;

        if (this.frameCountSinceSample < this.FRAME_SAMPLING_INTERVAL)
            return;

        const now = performance.now(),
            elapsed = now - this.previousSampleTimestamp;

        if (this.previousSampleTimestamp && elapsed > 0)
            this.currentFPS = this.FRAME_SAMPLING_INTERVAL * 1000 / elapsed;

        this.previousSampleTimestamp = now;
        this.frameCountSinceSample = 0;
    }

    public getFPS() {
        return this.currentFPS;
    }
}