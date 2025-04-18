import { Vector2, createUID, EntityID } from "./engine.js";
const CANVAS_ELEMENT = document.getElementById("canvas")! as HTMLCanvasElement;
const CONTEXT = CANVAS_ELEMENT.getContext("2d")!;
let canvasWidth = CANVAS_ELEMENT.width,
    canvasHeight = CANVAS_ELEMENT.height;

resizeCanvas();

let isAnimating = false;
let isStatsVisible = true;
const RENDER_BASE_COLOR = "black";
const TEXT_METRICS = CONTEXT.measureText("A");
const FONT_HEIGHT = TEXT_METRICS.actualBoundingBoxAscent + TEXT_METRICS.actualBoundingBoxDescent;

const DELTA_TIME = 1 / 60;
const PIXELS_PER_METER = 1000;
const FRICTION_MODELS = {
    CHARGE_AND_SHOOT: {
        /*
            The following is a link to a graph of the friction function with these parameters
            https://www.desmos.com/calculator/qrvumq7k66
        */
        minimum: 0.005,
        initial: 0.001,
        mod: 0.3,
        vScale: 3,
        vShift: 0.987010795852,
        computeFrictionCoefficient(speed: number) {
            const t = this.vScale * speed + this.vShift;
            return this.minimum + (t - 1) * this.mod / (t ** 2);
        }
    }
}

const ACCELERATION = 5 / Math.E;
const MAX_SPEED = 1;
const GRAVITY = 9.81;


const FPS_CALCULATION_INTERVAL = 20;
let lastFrameTime = 0;
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
    borderWidth: 0.1,
    left: 0,
    right: 4.096,
    top: 0,
    bottom: 2.048,
    getCenterX() {
        return this.left + this.getWidth() / 2;
    },
    getCenterY() {
        return this.top + this.getHeight() / 2;
    },
    getWidth() {
        return this.right - this.left;
    },
    getHeight() {
        return this.bottom - this.top;
    }
}

const WORLD_BACKGROUND = {
    backgroundColor: "#23262B",
    gridLineColor: "#424852",
    gridSize: 0.032,
    lineWidth: 0.001
}

export const MAIN_PARTICLE = {
    entityID: createUID(),
    color: "red",
    radius: 0.01,
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

export const VIEWPORT = {
    x: WORLD.getCenterX() - canvasWidth / (2 * PIXELS_PER_METER),
    y: WORLD.getCenterY() - canvasHeight / (2 * PIXELS_PER_METER),
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
        return (this.getWidth() / 2);
    },
    getCenterY() {
        return (this.getHeight() / 2)
    },
    target: MAIN_PARTICLE,
    overflowWorldBoundaries: false,
    update() {
        if (!this.target)
            return;

        let deadzoneBoundaryWidth = this.getDeadzoneBoundaryWidth();
        let xDistanceMax = this.getWidth() / 2 - deadzoneBoundaryWidth,
            yDistanceMax = this.getHeight() / 2 - deadzoneBoundaryWidth;

        let tX = (this.target.x - this.x) * PIXELS_PER_METER;
        let tY = (this.target.y - this.y) * PIXELS_PER_METER;

        let xDistance = tX - this.getCenterX(),
            yDistance = tY - this.getCenterY();

        let absDistanceX = Math.abs(xDistance),
            absDistanceY = Math.abs(yDistance);


        let speedFactor = Math.max(1, absDistanceX / this.getWidth(), absDistanceY / this.getHeight());


        if (absDistanceX > xDistanceMax) {
            this.x = lerp(this.x, this.x + Math.sign(xDistance) * (absDistanceX - xDistanceMax) / PIXELS_PER_METER, speedFactor * .1);
        }

        if (absDistanceY > yDistanceMax) {
            this.y = lerp(this.y, this.y + Math.sign(yDistance) * (absDistanceY - yDistanceMax) / PIXELS_PER_METER, speedFactor * .1);
        }

        if (this.overflowWorldBoundaries)
            return;

        const worldBorderWidth = WORLD.borderWidth;
        this.x = Math.max(WORLD.left - worldBorderWidth, Math.min(this.x, WORLD.right + worldBorderWidth - this.getWidth() / PIXELS_PER_METER));
        this.y = Math.max(WORLD.top - worldBorderWidth, Math.min(this.y, WORLD.bottom + worldBorderWidth - this.getHeight() / PIXELS_PER_METER));
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
    for (const binding of Object.keys(HOTKEYS).map(k => HOTKEYS[k])) {
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
    canvasWidth = CANVAS_ELEMENT.width = window.innerWidth * .98;
    canvasHeight = CANVAS_ELEMENT.height = window.innerHeight * .98;
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
    CONTEXT.fillRect(0, 0, canvasWidth, canvasHeight);
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

function updateVelocity(particle = MAIN_PARTICLE) {
    // Currently, particle coordinates correspond to the center of the particle
    let { vX, vY } = particle;
    const { x, y, aX, aY, radius: particleRadius } = particle;
    const g = GRAVITY,
        worldWidth = WORLD.getWidth(),
        worldHeight = WORLD.getHeight(),
        worldCenterX = WORLD.getCenterX(),
        worldCenterY = WORLD.getCenterY(),
        diffX = worldCenterX - x,
        diffY = worldCenterY - y,
        distanceX = Math.abs(diffX),
        distanceY = Math.abs(diffY),
        distanceXMax = worldWidth / 2 - particleRadius,
        distanceYMax = worldHeight / 2 - particleRadius,
        penetrationCorrectionThreshold = WORLD.borderWidth,
        penetrationDistanceX = distanceXMax + penetrationCorrectionThreshold,
        penetrationDistanceY = distanceYMax + penetrationCorrectionThreshold;

    // Apply acceleration
    vX += aX * DELTA_TIME;
    vY += aY * DELTA_TIME;
    let speed = Math.sqrt(vX ** 2 + vY ** 2);

    // Apply friction
    if (speed > 0) {
        const frictionCoefficient = FRICTION_MODELS.CHARGE_AND_SHOOT.computeFrictionCoefficient(speed),
            frictionalDeceleration = frictionCoefficient * g,
            frictionalDecelerationFactor = DELTA_TIME * frictionalDeceleration / speed;

        vX = lerp(vX, 0, frictionalDecelerationFactor);
        vY = lerp(vY, 0, frictionalDecelerationFactor);
        speed = Math.sqrt(vX ** 2 + vY ** 2);
    }

    if (speed > MAX_SPEED) {
        const maxSpeedFactor = MAX_SPEED / speed;
        vX *= maxSpeedFactor;
        vY *= maxSpeedFactor;
    }

    if (distanceX > distanceXMax) {
        let direction = Math.sign(diffX);
        vX = direction * (Math.abs(vX) + +(distanceX > penetrationDistanceX) * DELTA_TIME * ACCELERATION * distanceX / penetrationDistanceX);
    }

    if (distanceY > distanceYMax) {
        let direction = Math.sign(diffY);
        vY = direction * (Math.abs(vY) + +(distanceY > penetrationDistanceY) * DELTA_TIME * ACCELERATION * distanceY / penetrationDistanceY);
    }

    particle.vX = vX;
    particle.vY = vY;
    particle.computedSpeed = Math.sqrt(vX ** 2 + vY ** 2);
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

function updateMotion() {
    updateAcceleration(MAIN_PARTICLE);
    updateVelocity(MAIN_PARTICLE);
    updatePosition(MAIN_PARTICLE);
}

function activateControlBindings() {
    for (const controlBinding of Object.keys(CONTROLS).map(k => CONTROLS[k])) {
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

function drawComplexText(x: number, y: number, content = [["Colored ", "red"], ["\n"], ["Text ", "Blue"], ["Test", "Green"]], lineSpacing = 2) {
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

function formatStats(key: string, value: any) {
    return [`${key}: ${typeof value === "number" ? round(value) : value}\n`, "white"];
}

function drawStats() {
    drawComplexText(10, 10,
        Object.keys(STATS).map((key) => formatStats(key, STATS[key]())),
        2);
}

function drawParticle() {
    CONTEXT.beginPath();
    CONTEXT.arc(MAIN_PARTICLE.x, MAIN_PARTICLE.y, MAIN_PARTICLE.radius, 0, 2 * Math.PI);
    CONTEXT.fillStyle = MAIN_PARTICLE.color;
    CONTEXT.fill();
}

function drawWorldBackground() {
    const { backgroundColor, gridLineColor, gridSize, lineWidth } = WORLD_BACKGROUND;
    const { top, bottom, left, right, borderWidth } = WORLD;

    CONTEXT.fillStyle = backgroundColor;
    CONTEXT.fillRect(left - borderWidth, top - borderWidth, right + 2 * borderWidth, bottom + 2 * borderWidth);
    CONTEXT.strokeStyle = gridLineColor;
    CONTEXT.lineWidth = lineWidth;

    for (let vLine = left; vLine <= right + lineWidth; vLine += gridSize) {
        CONTEXT.beginPath();
        CONTEXT.moveTo(vLine, top);
        CONTEXT.lineTo(vLine, bottom);
        CONTEXT.stroke();
    }

    for (let hLine = top; hLine <= bottom + lineWidth; hLine += gridSize) {
        CONTEXT.beginPath();
        CONTEXT.moveTo(left, hLine);
        CONTEXT.lineTo(right, hLine);
        CONTEXT.stroke();
    }
}

function drawWorld() {
    drawWorldBackground();
    drawParticle();
}

function drawHUD() {
    if (VIEWPORT.borderEffect.isActive)
        VIEWPORT.borderEffect.draw();

    if (isStatsVisible)
        drawStats();
}

// Rendering
export function draw() {
    clearCanvas();
    CONTEXT.save();
    CONTEXT.scale(PIXELS_PER_METER, PIXELS_PER_METER);
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