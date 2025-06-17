export interface Renderer {
    clear(): void;
}

export interface ResizeHandler {
    (prevWidth: number, prevHeight: number, newWidth: number, newHeight: number): void;
}

const defaultResizeHandler: ResizeHandler = function (prevWidth: number, prevHeight: number, newWidth: number, newHeight: number) {

}

export class CanvasRenderer {
    public readonly canvasElement: HTMLCanvasElement;
    public readonly renderContext: CanvasRenderingContext2D;
    private readonly scale: number;
    public renderBaseColor: string;
    private width: number;
    private height: number;
    private resizeHandler?: ResizeHandler;

    constructor(canvasElement: HTMLCanvasElement, { scale = 0.98, renderBaseColor = "black", onresize = defaultResizeHandler } = {}) {
        this.canvasElement = canvasElement;
        this.renderContext = canvasElement.getContext("2d");
        this.scale = scale;
        this.renderBaseColor = renderBaseColor;
        this.width = canvasElement.width;
        this.height = canvasElement.height;
        this.resizeHandler = onresize.bind(this);
        window.addEventListener("resize", this.updateSize.bind(this));
        this.updateSize();
    }

    public getWidth(): number {
        return this.width;
    }

    public getHeight(): number {
        return this.height;
    }

    public updateSize() {
        const prevWidth = this.width, prevHeight = this.height, newWidth = window.innerWidth * this.scale, newHeight = window.innerHeight * this.scale;
        if (prevWidth === newWidth && prevHeight === newHeight)
            return;
        this.width = this.canvasElement.width = newWidth;
        this.height = this.canvasElement.height = newHeight;
        this.resizeHandler(prevWidth, prevHeight, newWidth, newHeight);
    }

    public clear() {
        this.renderContext.fillStyle = this.renderBaseColor;
        this.renderContext.fillRect(0, 0, this.width, this.height);
    }
}