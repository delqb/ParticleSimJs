import { Vec2, Vector2, createUID, EntityID } from "./engine.js";
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

export const DELTA_TIME = 1 / 60;
export const PIXELS_PER_METER = 1000;
const FRICTION_MODELS = {
    CLIMAX_AND_PLATEAU: {
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

export const ACCELERATION = 5 / Math.E;
export const MAX_SPEED = 1;
export const GRAVITY = 9.81;


const FPS_CALCULATION_INTERVAL = 20;
let lastFrameTime = 0;
let fpsFrameCounter = 0;
let fps = 0;

type KinematicSystemNode = {
    position: Vec2,
    velocity: Vec2,
    acceleration: Vec2
}

type CollisionSystemNode = {
    position: Vec2,
    velocity: Vec2,
    particleRadius: number
}

type MovementControlSystemNode = {
    acceleration: Vec2,
    controlInput: Vec2
}


type CameraComponent = {
    deadzoneWidth: number
}

type ViewportSystemNode = {
    position: Vec2,
    dimensions: Vec2,
    targetPosition: Vec2,
    cameraComponent: CameraComponent
}


const STATS = {
    isAnimating: () => isAnimating,
    fps: () => round(fps),
    position: () => `${round(MAIN_PARTICLE.position.x)}, ${round(MAIN_PARTICLE.position.y)}`,
    velocity: () => `${round(MAIN_PARTICLE.computedSpeed)} (${round(MAIN_PARTICLE.velocity.x)}, ${round(MAIN_PARTICLE.velocity.y)})`,
    acceleration: () => `${round(MAIN_PARTICLE.computedAcceleration)} (${round(MAIN_PARTICLE.acceleration.x)}, ${round(MAIN_PARTICLE.acceleration.y)})`,
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
    position: {
        x: WORLD.getCenterX(),
        y: WORLD.getCenterY()
    },
    velocity: {
        x: 0,
        y: 0
    },
    acceleration: {
        x: 0,
        y: 0
    },
    movementControlInput: {
        x: 0,
        y: 0
    },
    computedSpeed: 0,
    computedAcceleration: 0,
}

let kinematicSystemNode: KinematicSystemNode = {
    position: MAIN_PARTICLE.position,
    velocity: MAIN_PARTICLE.velocity,
    acceleration: MAIN_PARTICLE.acceleration
}

let collisionSystemNode: CollisionSystemNode = {
    position: MAIN_PARTICLE.position,
    velocity: MAIN_PARTICLE.velocity,
    particleRadius: MAIN_PARTICLE.radius
}

let movementControlSystemNode: MovementControlSystemNode = {
    acceleration: MAIN_PARTICLE.acceleration,
    controlInput: MAIN_PARTICLE.movementControlInput
}

export const VIEWPORT = {
    position: {
        x: WORLD.getCenterX() - canvasWidth / (2 * PIXELS_PER_METER),
        y: WORLD.getCenterY() - canvasHeight / (2 * PIXELS_PER_METER),
    },
    dimensions: {
        x: canvasWidth,
        y: canvasHeight
    },
    cameraComponent: {
        deadzoneWidth: 0.25 * Math.min(canvasWidth, canvasHeight)
    },
    targetPosition: MAIN_PARTICLE.position,
}

let viewportSystemNode: ViewportSystemNode = VIEWPORT;

function updateViewport(node: ViewportSystemNode) {
    if (!node)
        return;

    let { x, y } = node.position;
    const { x: width, y: height } = node.dimensions;
    const { x: targetWorldX, y: targetWorldY } = node.targetPosition;
    const deadzoneWidth = node.cameraComponent.deadzoneWidth;

    const centerX = width / 2, centerY = height / 2;

    const xDistanceMax = centerX - deadzoneWidth,
        yDistanceMax = centerY - deadzoneWidth;

    const targetViewportX = (targetWorldX - x) * PIXELS_PER_METER,
        targetViewportY = (targetWorldY - y) * PIXELS_PER_METER;

    const xDistance = targetViewportX - centerX,
        yDistance = targetViewportY - centerY;

    const absDistanceX = Math.abs(xDistance),
        absDistanceY = Math.abs(yDistance);


    const speedFactor = Math.max(1, absDistanceX / width, absDistanceY / height);


    if (absDistanceX > xDistanceMax) {
        x = lerp(x, x + Math.sign(xDistance) * (absDistanceX - xDistanceMax) / PIXELS_PER_METER, speedFactor * .1);
    }

    if (absDistanceY > yDistanceMax) {
        y = lerp(y, y + Math.sign(yDistance) * (absDistanceY - yDistanceMax) / PIXELS_PER_METER, speedFactor * .1);
    }

    const worldBorderWidth = WORLD.borderWidth;
    node.position.x = Math.max(WORLD.left - worldBorderWidth, Math.min(x, WORLD.right + worldBorderWidth - width / PIXELS_PER_METER));
    node.position.y = Math.max(WORLD.top - worldBorderWidth, Math.min(y, WORLD.bottom + worldBorderWidth - height / PIXELS_PER_METER));
}

const KEY_STATES = {
};

const CONTROLS = {
    up: {
        type: "movement",
        keys: ["w"],
        action: () => {
            MAIN_PARTICLE.movementControlInput.y += -1;
        }
    },
    down: {
        keys: ["s"],
        action: () => {
            MAIN_PARTICLE.movementControlInput.y += 1;
        }
    },
    left: {
        keys: ["a"],
        action: () => {
            MAIN_PARTICLE.movementControlInput.x += -1;
        }
    },
    right: {
        keys: ["d"],
        action: () => {
            MAIN_PARTICLE.movementControlInput.x += 1;
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

const CURSOR = {
    worldPosition: {
        x: 0,
        y: 0
    },
    screenPosition: {
        x: 0,
        y: 0
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

CANVAS_ELEMENT.addEventListener("mousemove", (event) => {
    let { offsetX: x, offsetY: y } = event;
    CURSOR.screenPosition = { x, y };
    CURSOR.worldPosition = { x: VIEWPORT.position.x + x / PIXELS_PER_METER, y: VIEWPORT.position.y + y / PIXELS_PER_METER };
});

function resizeCanvas() {
    canvasWidth = CANVAS_ELEMENT.width = window.innerWidth * .98;
    canvasHeight = CANVAS_ELEMENT.height = window.innerHeight * .98;
}

window.addEventListener("resize", resizeCanvas);

function round(num, decimalPlaces = 2) {
    return Math.round(num * 10 ** decimalPlaces) / 10 ** decimalPlaces;
}

function lerp(start: number, end: number, t: number) {
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

function updateVelocity(node: KinematicSystemNode) {
    const g = GRAVITY;
    const { velocity, acceleration } = node;
    let { x: vX, y: vY } = velocity;

    // Apply acceleration
    vX += acceleration.x * DELTA_TIME;
    vY += acceleration.y * DELTA_TIME;
    let speed = Math.sqrt(vX ** 2 + vY ** 2);

    // Apply friction
    if (speed > 0) {
        const frictionCoefficient = FRICTION_MODELS.CLIMAX_AND_PLATEAU.computeFrictionCoefficient(speed),
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

    velocity.x = vX;
    velocity.y = vY;
}

function updateCollision(node: CollisionSystemNode) {
    let { position, velocity, particleRadius } = node;
    let { x, y } = position;
    let { x: vX, y: vY } = velocity;

    const worldWidth = WORLD.getWidth(),
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

    if (distanceX > distanceXMax) {
        let direction = Math.sign(diffX);
        velocity.x = direction * (Math.abs(vX) + +(distanceX > penetrationDistanceX) * DELTA_TIME * ACCELERATION * distanceX / penetrationDistanceX);
    }

    if (distanceY > distanceYMax) {
        let direction = Math.sign(diffY);
        velocity.y = direction * (Math.abs(vY) + +(distanceY > penetrationDistanceY) * DELTA_TIME * ACCELERATION * distanceY / penetrationDistanceY);
    }
}

function updateMovementControl(node: MovementControlSystemNode) {
    const { acceleration, controlInput } = node;
    const { x: iX, y: iY } = controlInput;
    let { x: aX, y: aY } = acceleration;

    aX = 0;
    aY = 0;

    if (iX || iY) {
        const factor = ACCELERATION / Math.sqrt(iX ** 2 + iY ** 2);
        aX = factor * iX;
        aY = factor * iY;
    }

    acceleration.x = aX;
    acceleration.y = aY;
    controlInput.x = 0;
    controlInput.y = 0;
}

function updatePosition(node: KinematicSystemNode) {
    node.position.x += node.velocity.x * DELTA_TIME;
    node.position.y += node.velocity.y * DELTA_TIME;
}

function updateMotion() {
    updateMovementControl(movementControlSystemNode);
    updateVelocity(kinematicSystemNode);
    updateCollision(collisionSystemNode)
    updatePosition(kinematicSystemNode);
    MAIN_PARTICLE.computedAcceleration = Math.sqrt(MAIN_PARTICLE.acceleration.x ** 2 + MAIN_PARTICLE.acceleration.y ** 2);
    MAIN_PARTICLE.computedSpeed = Math.sqrt(MAIN_PARTICLE.velocity.x ** 2 + MAIN_PARTICLE.velocity.y ** 2);

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
    updateViewport(viewportSystemNode);
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
    CONTEXT.arc(MAIN_PARTICLE.position.x, MAIN_PARTICLE.position.y, MAIN_PARTICLE.radius, 0, 2 * Math.PI);
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

function drawViewport() {
    const isActive = false;
    if (!isActive)
        return;

    let borderWidth = VIEWPORT.cameraComponent.deadzoneWidth / 10;
    let vWidth = VIEWPORT.dimensions.x,
        vHeight = VIEWPORT.dimensions.y;
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

function drawHUD() {
    drawViewport();
    // drawComplexText(CURSOR.screenPosition.x, CURSOR.screenPosition.y, [CURSOR.screenPosition, CURSOR.worldPosition].map((o: Vec2) => [`${round(o.x)}, ${round(o.y)}\n`, "white"]));

    if (isStatsVisible)
        drawStats();
}

// Rendering
export function draw() {
    clearCanvas();
    CONTEXT.save();
    CONTEXT.scale(PIXELS_PER_METER, PIXELS_PER_METER);
    CONTEXT.translate(-VIEWPORT.position.x, -VIEWPORT.position.y);
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

VIEWPORT.targetPosition = MAIN_PARTICLE.position;
animate();