const canvasElement = document.getElementById("canvas");
const ctx = canvasElement.getContext("2d");
const canvasWidth = canvasElement.width
const canvasHeight = canvasElement.height;

let renderBaseColor = "black";
let isAnimating = false;
let isStatsVisible = true;
let textMetrics = ctx.measureText("A");
let fontHeight = textMetrics.actualBoundingBoxAscent + textMetrics.actualBoundingBoxDescent;

const deltaTime = 1 / 60;
const frictionCoefficient = 0.006;

let lastFrameTime = null;
let fpsCalculationFrequency = 20;
let fpsFrameCounter = 0;
let fps = 0;

let animateStatName = "Animation";
let animateStatNameMeasure = ctx.measureText(animateStatName).width;

let stats = {
    fps: () => fps,

}

let worldBounds = {
    left: 10,
    right: canvasWidth - 10,
    top: 10,
    bottom: canvasHeight - 10,
    getCenterX: () => (worldBounds.right - worldBounds.left) / 2,
    getCenterY: () => (worldBounds.bottom - worldBounds.top) / 2,
}

let particle1 = {
    color: "red",
    size: 3,
    mass: 10,
    x: worldBounds.getCenterX(),
    y: worldBounds.getCenterY(),
    vX: 700,
    vY: 550,
}

function clearCanvas() {
    ctx.fillStyle = renderBaseColor;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
}

function updateFPS() {
    fpsFrameCounter++;

    if (fpsFrameCounter < fpsCalculationFrequency)
        return;

    fpsFrameCounter = 0;

    let now = Date.now();

    if (lastFrameTime)
        fps = Math.round(100 * fpsCalculationFrequency * 1000 / (now - lastFrameTime)) / 100;

    lastFrameTime = now;
}

function updateStats() {
    updateFPS();
}

function differenceSquared(a, b) {
    return (a - b) * (a - b);
}

function updateVelocity(particle) {
    if (differenceSquared(particle.x, worldBounds.left) <= particle.size || differenceSquared(particle.x, worldBounds.right) <= particle.size)
        particle.vX *= -1;

    if (differenceSquared(particle.y, worldBounds.top) <= particle.size || differenceSquared(particle.y, worldBounds.bottom) <= particle.size)
        particle.vY *= -1;
}



function updatePosition(particle) {
    particle.x += particle.vX * deltaTime;
    particle.y += particle.vY * deltaTime;
}

function applyFriction(particle, frictionCoefficient) {
    particle.vX *= (1 - frictionCoefficient);
    particle.vY *= (1 - frictionCoefficient);
}

function updateMotion() {
    updateVelocity(particle1);
    updatePosition(particle1);
    applyFriction(particle1, frictionCoefficient);
}

// Game logic
function update() {
    updateStats();
    updateMotion();
}

function drawFPS() {
    ctx.fillStyle = "white";
    ctx.fillText("FPS: " + stats.fps(), 10, 10);
}

function drawComplexText(x, y, content = [["Colored ", "red"], ["\n"], ["Text ", "Blue"], ["Test", "Green"]], lineSpacing = 2) {
    let xOrig = x;
    for (const piece of content) {
        let text = piece[0];
        let color = piece.length > 1 ? piece[1] : ctx.fillStyle;
        ctx.fillStyle = color;
        if (text.includes("\n")) {
            for (const line of text.split("\n")) {
                ctx.fillText(line, x, y);
                y += fontHeight + lineSpacing;
                x = xOrig;
            }
        }
        else {
            ctx.fillText(text, x, y);
            x += ctx.measureText(text).width;
        }
    }
    return y;
}

function drawAnimationStat() {
    drawComplexText(10, 10 + fontHeight + 2,
        [
            [`${animateStatName}: `, "white"],
            isAnimating ? ["on", "green"] : ["off", "red"]
        ]
    );
}

function drawStats() {
    drawComplexText(10, 10,
        [
            ["FPS: " + stats.fps(), "white"],
            ["\n"],
            ["Animate: ", "white"],
            isAnimating ? ["on", "green"] : ["off", "red"]
        ],
        2)
    // drawFPS();
    // drawAnimationStat();
}

function drawParticle() {
    ctx.beginPath();
    ctx.arc(particle1.x, particle1.y, particle1.size, 0, 2 * Math.PI);
    ctx.fillStyle = particle1.color;
    ctx.fill();
}

// Rendering
function draw() {
    clearCanvas();
    if (isStatsVisible)
        drawStats();
    drawParticle();
}

// Game loop
function animate() {
    update();
    draw();
    if (isAnimating)
        requestAnimationFrame(animate);
}

function startAnimation() {
    if (isAnimating)
        return;
    isAnimating = true;
    animate();
}

function stopAnimation() {
    isAnimating = false;
}

draw();

// startAnimation();