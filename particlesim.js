const CANVAS_ELEMENT = document.getElementById("canvas");
const CONTEXT = CANVAS_ELEMENT.getContext("2d");
let canvasWidth = CANVAS_ELEMENT.width,
    canvasHeight = CANVAS_ELEMENT.height;

resizeCanvas();

let isAnimating = false;
let isStatsVisible = true;
const RENDER_BASE_COLOR = "black";
const TEXT_METRICS = CONTEXT.measureText("A");
const FONT_HEIGHT = TEXT_METRICS.actualBoundingBoxAscent + TEXT_METRICS.actualBoundingBoxDescent;

const DELTA_TIME = 1 / 60;
const FRICTION_COEFFICIENT = 0.012;
const ACCELERATION = 1200 * Math.E;
const MAX_SPEED = 1000;


const FPS_CALCULATION_INTERVAL = 20;
let lastFrameTime = null;
let fpsFrameCounter = 0;
let fps = 0;

const STATS = {
    isAnimating: () => isAnimating,
    fps: () => round(fps),
    position: () => `${round(MAIN_PARTICLE.x)}, ${round(MAIN_PARTICLE.y)}`,
    velocity: () => `${round(MAIN_PARTICLE.computedSpeed)} (${round(MAIN_PARTICLE.vX)}, ${round(MAIN_PARTICLE.vY)})`,
    acceleration: () => `${round(MAIN_PARTICLE.computedAcceleration)} (${round(MAIN_PARTICLE.aX)}, ${round(MAIN_PARTICLE.aY)})`,
}

const WORLD = {
    borderWidth: 10,
    left: 10,
    right: 2038,
    top: 10,
    bottom: 2038,
    getCenterX: () => (WORLD.right - WORLD.left) / 2,
    getCenterY: () => (WORLD.bottom - WORLD.top) / 2,
    getWidth: () => WORLD.getCenterX() - WORLD.left,
    getHeight: () => WORLD.getCenterY() - WORLD.top
}

const VIEWPORT = {
    x: WORLD.getCenterX() - canvasWidth / 2,
    y: WORLD.getCenterY() - canvasHeight / 2,
    deadzoneBoundaryCoefficient: 0.25,
    getDeadzoneBoundaryWidth() {
        return this.deadzoneBoundaryCoefficient * Math.min(this.getWidth(), this.getHeight());
    },
    getWidth() {
        return canvasWidth;
    },
    getHeight() {
        return canvasHeight;
    },
    getCenterX() {
        return (this.x + this.getWidth() / 2);
    },
    getCenterY() {
        return (this.y + this.getHeight() / 2)
    },
    target: null,
    update() {
        if (!this.target)
            return;

        let deadzoneBoundaryWidth = this.getDeadzoneBoundaryWidth();
        let xDistanceMax = this.getWidth() / 2 - deadzoneBoundaryWidth,
            yDistanceMax = this.getHeight() / 2 - deadzoneBoundaryWidth;

        let { x: pX, y: pY } = this.target;

        let xDistance = pX - this.getCenterX(),
            yDistance = pY - this.getCenterY();

        let absDistanceX = Math.abs(xDistance),
            absDistanceY = Math.abs(yDistance);


        let speedFactor = Math.max(1, absDistanceX / this.getWidth(), absDistanceY / this.getHeight());


        if (absDistanceX > xDistanceMax) {
            this.x = lerp(this.x, this.x + Math.sign(xDistance) * (absDistanceX - xDistanceMax), speedFactor * .1);
        }

        if (absDistanceY > yDistanceMax) {
            this.y = lerp(this.y, this.y + Math.sign(yDistance) * (absDistanceY - yDistanceMax), speedFactor * .1);
        }

        this.x = Math.max(WORLD.left, Math.min(this.x, WORLD.right - this.getWidth()));
        this.y = Math.max(WORLD.top, Math.min(this.y, WORLD.bottom - this.getHeight()));
    },
    borderEffect: {
        isActive: true,
        draw() {
            let borderWidth = VIEWPORT.getDeadzoneBoundaryWidth() / 10;
            let vWidth = VIEWPORT.getWidth(),
                vHeight = VIEWPORT.getHeight();
            let darkShade = "rgba(0,0,0,1)",
                transparentShade = "rgba(0,0,0,0)";

            let wCS1 = borderWidth / vWidth;
            let grad = CONTEXT.createLinearGradient(0, 0, vWidth, 0);
            grad.addColorStop(0, darkShade);
            grad.addColorStop(wCS1, transparentShade);
            grad.addColorStop(1 - wCS1, transparentShade);
            grad.addColorStop(1, darkShade);

            CONTEXT.fillStyle = grad;
            CONTEXT.fillRect(0, 0, vWidth, vHeight);

            let hCS1 = borderWidth / vHeight;
            grad = CONTEXT.createLinearGradient(0, 0, 0, vHeight);
            grad.addColorStop(0, darkShade);
            grad.addColorStop(hCS1, transparentShade);
            grad.addColorStop(1 - hCS1, transparentShade);
            grad.addColorStop(1, darkShade);

            CONTEXT.fillStyle = grad;
            CONTEXT.fillRect(0, 0, vWidth, vHeight);
        }
    }
}

const WORLD_BACKGROUND = {
    backgroundColor: "#23262B",
    gridLineColor: "#424852",
    gridSize: 32,
    lineWidth: 1
}

const MAIN_PARTICLE = {
    color: "red",
    radius: 10,
    mass: 10,
    x: WORLD.getCenterX(),
    y: WORLD.getCenterY(),
    vX: 0,
    vY: 0,
    aX: 0,
    aY: 0,
    daX: 0,
    daY: 0,
    computedSpeed: 0,
    computedAcceleration: 0,
    getAccelerationMagnitude: () => {
        return Math.sqrt(MAIN_PARTICLE.aX ** 2 + MAIN_PARTICLE.aY ** 2);
    },
    getSpeedSquared: () => {
        return MAIN_PARTICLE.vX * MAIN_PARTICLE.vX + MAIN_PARTICLE.vY * MAIN_PARTICLE.vY;
    }
}

const KEY_STATES = {
};

const CONTROLS = {
    up: {
        type: "movement",
        keys: ["w"],
        action: () => {
            MAIN_PARTICLE.daY += -1;
        }
    },
    down: {
        keys: ["s"],
        action: () => {
            MAIN_PARTICLE.daY += 1;
        }
    },
    left: {
        keys: ["a"],
        action: () => {
            MAIN_PARTICLE.daX += -1;
        }
    },
    right: {
        keys: ["d"],
        action: () => {
            MAIN_PARTICLE.daX += 1;
        }
    }
};

const HOTKEYS = {
    pause: {
        keys: ["Escape", " "],
        action: () => {
            toggleAnimation();
        }
    }
}

function activateHotkeyBindings() {
    for (const binding of Object.values(HOTKEYS)) {
        if (binding.keys.some(k => KEY_STATES[k]))
            binding.action();
    }
}



window.addEventListener("keydown", (event) => {
    KEY_STATES[event.key] = true;
    activateHotkeyBindings();
});

window.addEventListener("keyup", (event) => {
    KEY_STATES[event.key] = false;
});

function resizeCanvas() {
    canvasWidth = canvas.width = window.innerWidth * .98;
    canvasHeight = canvas.height = window.innerHeight * .98;
}

window.addEventListener("resize", resizeCanvas);

function round(num, decimalPlaces = 2) {
    return Math.round(num * 10 ** decimalPlaces) / 10 ** decimalPlaces;
}

function lerp(start, end, t) {
    return start + (end - start) * t;
}

function clearCanvas() {
    CONTEXT.fillStyle = RENDER_BASE_COLOR;
    CONTEXT.fillRect(0, 0, WORLD.getWidth(), WORLD.getHeight());
}

function updateFPS() {
    fpsFrameCounter++;

    if (fpsFrameCounter < FPS_CALCULATION_INTERVAL)
        return;

    fpsFrameCounter = 0;

    let now = Date.now();

    if (lastFrameTime)
        fps = Math.round(100 * FPS_CALCULATION_INTERVAL * 1000 / (now - lastFrameTime)) / 100;

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
    let worldWidth = WORLD.getWidth(),
        worldHeight = WORLD.getHeight();
    let distanceToCenterX = Math.abs(WORLD.getCenterX() - x),
        distanceToCenterY = Math.abs(WORLD.getCenterY() - y);

    if (distanceToCenterX > worldWidth - size) {
        let direction = Math.sign(WORLD.getCenterX() - x);
        particle.vX = direction * (Math.abs(vX) + 3 * (distanceToCenterX - worldWidth) * DELTA_TIME);
    }

    if (distanceToCenterY > worldHeight - size) {
        let direction = Math.sign(WORLD.getCenterY() - y);
        particle.vY = direction * (Math.abs(vY) + 3 * (distanceToCenterY - worldHeight) * DELTA_TIME);
    }

    particle.vX += aX * DELTA_TIME;
    particle.vY += aY * DELTA_TIME;

    let speed = particle.computedSpeed = Math.sqrt(vX ** 2 + vY ** 2);

    if (speed > MAX_SPEED) {
        const factor = MAX_SPEED / speed;
        particle.vX *= factor;
        particle.vY *= factor;
        particle.computedSpeed = MAX_SPEED;
    }
}

function updateAcceleration(particle) {
    const { daX, daY } = particle;
    let magnitude = Math.sqrt(daX ** 2 + daY ** 2);
    if (magnitude) {
        const factor = ACCELERATION / magnitude;
        particle.aX = factor * daX;
        particle.aY = factor * daY;
        particle.computedAcceleration = ACCELERATION;
    } else {
        particle.aX = 0;
        particle.aY = 0;
        particle.computedAcceleration = 0;
    }
    particle.daX = 0;
    particle.daY = 0;
}

function updatePosition(particle) {
    particle.x += particle.vX * DELTA_TIME;
    particle.y += particle.vY * DELTA_TIME;
}

function applyFriction(particle, frictionCoefficient) {
    particle.vX *= (1 - frictionCoefficient);
    particle.vY *= (1 - frictionCoefficient);
}

function updateMotion() {
    updateAcceleration(MAIN_PARTICLE);
    updateVelocity(MAIN_PARTICLE);
    updatePosition(MAIN_PARTICLE);
    applyFriction(MAIN_PARTICLE, FRICTION_COEFFICIENT);
}

function activateControlBindings() {
    for (const controlBinding of Object.values(CONTROLS)) {
        if (controlBinding.keys.some(k => KEY_STATES[k]))
            controlBinding.action();
    }
}

// Game logic
function update() {
    activateControlBindings();
    updateStats();
    updateMotion();
    VIEWPORT.update();
}

function drawComplexText(x, y, content = [["Colored ", "red"], ["\n"], ["Text ", "Blue"], ["Test", "Green"]], lineSpacing = 2) {
    let xOrig = x;
    for (const piece of content) {
        let text = piece[0];
        let color = piece.length > 1 ? piece[1] : CONTEXT.fillStyle;
        CONTEXT.fillStyle = color;
        if (text.includes("\n")) {
            for (const line of text.split("\n")) {
                CONTEXT.fillText(line, x, y);
                y += FONT_HEIGHT + lineSpacing;
                x = xOrig;
            }
        }
        else {
            CONTEXT.fillText(text, x, y);
            x += CONTEXT.measureText(text).width;
        }
    }
    return y;
}

function formatStats(key, value) {
    return [`${key}: ${typeof value === "number" ? round(value) : value}\n`, "white"];
}

function drawStats() {
    drawComplexText(10, 10,
        Object.entries(STATS).map(([key, val]) => formatStats(key, val())),
        2);
}

function drawParticle() {
    CONTEXT.beginPath();
    CONTEXT.arc(MAIN_PARTICLE.x, MAIN_PARTICLE.y, MAIN_PARTICLE.radius, 0, 2 * Math.PI);
    CONTEXT.fillStyle = MAIN_PARTICLE.color;
    CONTEXT.fill();
}

function drawBackground() {
    const { backgroundColor, gridLineColor, gridSize, lineWidth } = WORLD_BACKGROUND;

    const { top, bottom, left, right } = WORLD;
    const borderWidth = WORLD.borderWidth;

    CONTEXT.fillStyle = backgroundColor;
    CONTEXT.fillRect(left - borderWidth, top - borderWidth, right + borderWidth, bottom + borderWidth);
    CONTEXT.strokeStyle = gridLineColor;
    CONTEXT.lineWidth = lineWidth;

    for (let vLine = left; vLine < right; vLine += gridSize) {
        CONTEXT.beginPath();
        CONTEXT.moveTo(vLine, top);
        CONTEXT.lineTo(vLine, bottom);
        CONTEXT.stroke();
    }

    for (let hLine = top; hLine < bottom; hLine += gridSize) {
        CONTEXT.beginPath();
        CONTEXT.moveTo(left, hLine);
        CONTEXT.lineTo(right, hLine);
        CONTEXT.stroke();
    }
}

function drawWorld() {
    drawBackground();
    drawParticle();
}

function drawHUD() {
    if (VIEWPORT.borderEffect.isActive)
        VIEWPORT.borderEffect.draw();

    if (isStatsVisible)
        drawStats();
}

// Rendering
function draw() {
    clearCanvas();
    CONTEXT.save();
    CONTEXT.translate(-VIEWPORT.x, -VIEWPORT.y);
    drawWorld();
    CONTEXT.restore();
    drawHUD();
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

VIEWPORT.target = MAIN_PARTICLE;
draw();
startAnimation();