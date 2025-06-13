export interface Renderer {
    clear(): void;
}

export class CanvasRenderer {
    public readonly canvasElement: HTMLCanvasElement;
    public readonly renderContext: CanvasRenderingContext2D;
    private readonly scale: number;
    public renderBaseColor: string;
    private width: number;
    private height: number;

    constructor(canvasElement: HTMLCanvasElement, { scale = 0.98, renderBaseColor = "black" } = {}) {
        this.canvasElement = canvasElement;
        this.renderContext = canvasElement.getContext("2d");
        this.scale = scale;
        this.renderBaseColor = renderBaseColor;
        this.width = canvasElement.width;
        this.height = canvasElement.height;
        window.addEventListener("resize", this.updateSize.bind(this));
    }

    public getWidth(): number {
        return this.width;
    }

    public getHeight(): number {
        return this.height;
    }

    public updateSize() {
        this.width = this.canvasElement.width = window.innerWidth * this.scale;
        this.height = this.canvasElement.height = window.innerHeight * this.scale;
    }

    public clear() {
        this.renderContext.fillStyle = this.renderBaseColor;
        this.renderContext.fillRect(0, 0, this.width, this.height);
    }
}