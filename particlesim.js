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
    vX: 250,
    vY: 0,
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

function updateVelocity(particle) {

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

function drawAnimationStat() {
    ctx.fillStyle = "white";
    ctx.fillText(`${animateStatName}: `, 10, 10 + fontHeight + 2);
    ctx.fillStyle = isAnimating ? "green" : "red";
    ctx.fillText(isAnimating ? "on" : "off", 10 + animateStatNameMeasure + textMetrics.width, 10 + fontHeight + 2);
}

function drawStats() {
    drawFPS();
    drawAnimationStat();
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
    isAnimating = true;
    animate();
}

function stopAnimation() {
    isAnimating = false;
}

draw();

// startAnimation();