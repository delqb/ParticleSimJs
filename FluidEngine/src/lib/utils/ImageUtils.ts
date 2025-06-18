export function loadImage(src: string, timeoutMs = 10000): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();

        const timer = setTimeout(() => {
            img.src = ""; // Cancels the load
            reject(new Error(`Timeout while loading image: "${src}"`));
        }, timeoutMs);

        img.onload = () => {
            clearTimeout(timer);
            resolve(img);
        };

        img.onerror = (event) => {
            clearTimeout(timer);
            const error = new Error(`Failed to load image: "${src}"`);
            // Attach original event for debugging if needed
            (error as any).event = event;
            (error as any).src = src;

            reject(error);
        };

        // Set this *after* the handlers to avoid race conditions
        img.src = src;
    });
}

export function canvasToImage(canvas: HTMLCanvasElement, imageObject?: HTMLImageElement) {
    const imageDataUrl = canvas.toDataURL();
    const image = imageObject || new Image();
    image.src = imageDataUrl;
    return image;
}
