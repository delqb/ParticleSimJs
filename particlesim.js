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

const WORLD_PROPERTIES = {
    borderWidth: 10,
    left: 10,
    right: 2038,
    top: 10,
    bottom: 2038,
    getCenterX: () => (WORLD_PROPERTIES.right - WORLD_PROPERTIES.left) / 2,
    getCenterY: () => (WORLD_PROPERTIES.bottom - WORLD_PROPERTIES.top) / 2,
    getWidth: () => WORLD_PROPERTIES.getCenterX() - WORLD_PROPERTIES.left,
    getHeight: () => WORLD_PROPERTIES.getCenterY() - WORLD_PROPERTIES.top
}

const VIEWPORT = {
    x: WORLD_PROPERTIES.getCenterX() - canvasWidth / 2,
    y: WORLD_PROPERTIES.getCenterY() - canvasHeight / 2,
    followBoundaryCoefficient: 0.25,
    getFollowBoundaryWidth() {
        return this.followBoundaryCoefficient * Math.min(this.getWidth(), this.getHeight());
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
    followTarget: null,
    update() {
        if (!this.followTarget)
            return;

        let followBoundaryWidth = this.getFollowBoundaryWidth();
        let xFollowDistance = this.getWidth() / 2 - followBoundaryWidth,
            yFollowDistance = this.getHeight() / 2 - followBoundaryWidth;

        let { x: pX, y: pY } = this.followTarget;

        let distanceX = pX - this.getCenterX(),
            distanceY = pY - this.getCenterY();

        let absDistanceX = Math.abs(distanceX),
            absDistanceY = Math.abs(distanceY);


        let speedFactor = Math.max(1, absDistanceX / this.getWidth(), absDistanceY / this.getHeight());


        if (absDistanceX > xFollowDistance) {
            this.x = lerp(this.x, this.x + Math.sign(distanceX) * (absDistanceX - xFollowDistance), speedFactor * .1);
        }

        if (absDistanceY > yFollowDistance) {
            this.y = lerp(this.y, this.y + Math.sign(distanceY) * (absDistanceY - yFollowDistance), speedFactor * .1);
        }

        this.x = Math.max(WORLD_PROPERTIES.left, Math.min(this.x, WORLD_PROPERTIES.right - this.getWidth()));
        this.y = Math.max(WORLD_PROPERTIES.top, Math.min(this.y, WORLD_PROPERTIES.bottom - this.getHeight()));
    },
    borderEffect: {
        isActive: true,
        draw() {
            let borderWidth = VIEWPORT.getFollowBoundaryWidth() / 10;
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

const BACKGROUND_PROPERTIES = {
    backgroundColor: "#23262B",
    gridLineColor: "#424852",
    gridScale: 50,
    lineWidth: 1
}

const MAIN_PARTICLE = {
    color: "red",
    size: 10,
    mass: 10,
    x: WORLD_PROPERTIES.getCenterX(),
    y: WORLD_PROPERTIES.getCenterY(),
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
    CONTEXT.fillRect(0, 0, WORLD_PROPERTIES.getWidth(), WORLD_PROPERTIES.getHeight());
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
    let worldWidth = WORLD_PROPERTIES.getWidth(),
        worldHeight = WORLD_PROPERTIES.getHeight();
    let distanceToCenterX = Math.abs(WORLD_PROPERTIES.getCenterX() - x),
        distanceToCenterY = Math.abs(WORLD_PROPERTIES.getCenterY() - y);

    if (distanceToCenterX > worldWidth - size) {
        let direction = Math.sign(WORLD_PROPERTIES.getCenterX() - x);
        particle.vX = direction * (Math.abs(vX) + 3 * (distanceToCenterX - worldWidth) * DELTA_TIME);
    }

    if (distanceToCenterY > worldHeight - size) {
        let direction = Math.sign(WORLD_PROPERTIES.getCenterY() - y);
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
    CONTEXT.arc(MAIN_PARTICLE.x, MAIN_PARTICLE.y, MAIN_PARTICLE.size, 0, 2 * Math.PI);
    CONTEXT.fillStyle = MAIN_PARTICLE.color;
    CONTEXT.fill();
}

function drawBackground() {
    const { backgroundColor, gridLineColor, gridScale, lineWidth } = BACKGROUND_PROPERTIES;

    const { top, bottom, left, right } = WORLD_PROPERTIES;

    CONTEXT.fillStyle = backgroundColor;
    CONTEXT.fillRect(0, 0, right + WORLD_PROPERTIES.borderWidth, bottom + WORLD_PROPERTIES.borderWidth);
    CONTEXT.strokeStyle = gridLineColor;
    CONTEXT.lineWidth = lineWidth;

    for (let lineX = left; lineX < right; lineX += (WORLD_PROPERTIES.getWidth() - WORLD_PROPERTIES.borderWidth) / gridScale) {
        CONTEXT.beginPath();
        CONTEXT.moveTo(lineX, top);
        CONTEXT.lineTo(lineX, bottom);
        CONTEXT.stroke();
    }

    for (let lineY = top; lineY < bottom; lineY += WORLD_PROPERTIES.getHeight() / gridScale) {
        CONTEXT.beginPath();
        CONTEXT.moveTo(left, lineY);
        CONTEXT.lineTo(right, lineY);
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

VIEWPORT.followTarget = MAIN_PARTICLE;
draw();
startAnimation();