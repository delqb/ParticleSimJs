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
const frictionCoefficient = 0.012;
const acceleration = 1200 * Math.E,
    diagonalAccelerationComponent = acceleration * Math.SQRT1_2;
const maxSpeed = 12000;


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
    getWidth: () => worldBounds.getCenterX() - worldBounds.left,
    getHeight: () => worldBounds.getCenterY() - worldBounds.top
}

let particle1 = {
    color: "red",
    size: 10,
    mass: 10,
    x: worldBounds.getCenterX(),
    y: worldBounds.getCenterY(),
    vX: 0,
    vY: 0,
    aX: 0,
    aY: 0,
    daX: 0,
    daY: 0,
    computedSpeed: 0,
    getAccelerationMagnitude: () => {
        return Math.sqrt(particle1.aX ** 2 + particle1.aY ** 2);
    },
    getSpeedSquared: () => {
        return particle1.vX * particle1.vX + particle1.vY * particle1.vY;
    }
}

let keyStates = {
};

let bindings = {
    up: {
        type: "movement",
        keys: ["w"],
        action: () => {
            particle1.daY += -1;
        }
    },
    down: {
        keys: ["s"],
        action: () => {
            particle1.daY += 1;
        }
    },
    left: {
        keys: ["a"],
        action: () => {
            particle1.daX += -1;
        }
    },
    right: {
        keys: ["d"],
        action: () => {
            particle1.daX += 1;
        }
    }
};

window.addEventListener("keydown", (event) => {
    keyStates[event.key] = true;
});

window.addEventListener("keyup", (event) => {
    keyStates[event.key] = false;
});

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
    let { x, y, vX, vY, aX, aY, size } = particle;
    let worldWidth = worldBounds.getWidth(),
        worldHeight = worldBounds.getHeight();
    let distanceToCenterX = Math.abs(worldBounds.getCenterX() - x),
        distanceToCenterY = Math.abs(worldBounds.getCenterY() - y);

    if (distanceToCenterX > worldWidth - size) {
        let direction = Math.sign(worldBounds.getCenterX() - x);
        particle.vX = direction * (Math.abs(vX) + 3 * (distanceToCenterX - worldWidth) * deltaTime);
    }

    if (distanceToCenterY > worldHeight - size) {
        let direction = Math.sign(worldBounds.getCenterY() - y);
        particle.vY = direction * (Math.abs(vY) + 3 * (distanceToCenterY - worldHeight) * deltaTime);
    }

    particle.vX += aX * deltaTime;
    particle.vY += aY * deltaTime;

    let speed = particle.computedSpeed = Math.sqrt(vX ** 2 + vY ** 2);

    if (speed > maxSpeed) {
        let factor = maxSpeed / speed;
        particle.vX *= factor;
        particle.vY *= factor;
        particle.computedSpeed = maxSpeed;
    }
}

function updateAcceleration(particle) {
    let { daX, daY } = particle;
    let magnitude = Math.sqrt(daX ** 2 + daY ** 2);
    if (magnitude) {
        particle.aX = acceleration * daX / magnitude;
        particle.aY = acceleration * daY / magnitude;
    } else {
        particle.aX = 0;
        particle.aY = 0;
    }
    particle.daX = 0;
    particle.daY = 0;
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
    updateAcceleration(particle1);
    updateVelocity(particle1);
    updatePosition(particle1);
    applyFriction(particle1, frictionCoefficient);
    particle1.aX = 0;
    particle1.aY = 0;
}

function activateKeyBindings() {
    for (const binding of Object.values(bindings)) {
        if (binding.keys.some(k => keyStates[k]))
            binding.action();
    }
}

// Game logic
function update() {
    activateKeyBindings();
    updateStats();
    updateMotion();
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

function drawStats() {
    const { getAccelerationMagnitude, getSpeedSquared, aX, aY, daX, daY, ...particleStats } = particle1;
    drawComplexText(10, 10,
        [
            [`FPS: ${stats.fps()}\n`, "white"],
            ["Animate: ", "white"],
            isAnimating ? ["on", "green"] : ["off", "red"],
            ["\n"],
            ...Object.entries(particleStats).map(([key, val]) => [`${key}: ${parseFloat(val + "") ? Math.round(val * 100) / 100 : val}\n`, "white"]),
            // [`Acceleration: ${particle1.getAccelerationMagnitude()}\n`, "white"],
        ],
        2);
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
    drawParticle();
    if (isStatsVisible)
        drawStats();
}

// Game loop
function animate() {
    draw();
    update();
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

function toggleAnimation() {
    if (isAnimating)
        stopAnimation();
    else
        startAnimation();
}

draw();

// startAnimation();