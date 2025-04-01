const canvasElement = document.getElementById("canvas");
const ctx = canvasElement.getContext("2d");
let canvasWidth = canvasElement.width,
    canvasHeight = canvasElement.height;

resizeCanvas();

let renderBaseColor = "black";
let isAnimating = false;
let isStatsVisible = true;
let textMetrics = ctx.measureText("A");
let fontHeight = textMetrics.actualBoundingBoxAscent + textMetrics.actualBoundingBoxDescent;

const deltaTime = 1 / 60;
const frictionCoefficient = 0.012;
const acceleration = 1200 * Math.E,
    diagonalAccelerationComponent = acceleration * Math.SQRT1_2;
const maxSpeed = 1000;


let lastFrameTime = null;
let fpsCalculationFrequency = 20;
let fpsFrameCounter = 0;
let fps = 0;

let animateStatName = "Animation";
let animateStatNameMeasure = ctx.measureText(animateStatName).width;

let stats = {
    isAnimating: () => isAnimating,
    fps: () => round(fps),
    position: () => `${round(mainParticle.x)}, ${round(mainParticle.y)}`,
    velocity: () => `${round(mainParticle.computedSpeed)} (${round(mainParticle.vX)}, ${round(mainParticle.vY)})`,
    acceleration: () => `${round(mainParticle.computedAcceleration)} (${round(mainParticle.aX)}, ${round(mainParticle.aY)})`,
}

let worldBounds = {
    borderWidth: 10,
    left: 10,
    right: 2038,
    top: 10,
    bottom: 2048,
    getCenterX: () => (worldBounds.right - worldBounds.left) / 2,
    getCenterY: () => (worldBounds.bottom - worldBounds.top) / 2,
    getWidth: () => worldBounds.getCenterX() - worldBounds.left,
    getHeight: () => worldBounds.getCenterY() - worldBounds.top
}

let viewport = {
    x: worldBounds.getCenterX() - canvasWidth / 2,
    y: worldBounds.getCenterY() - canvasHeight / 2,
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

        this.x = Math.max(worldBounds.left, Math.min(this.x, worldBounds.right - this.getWidth()));
        this.y = Math.max(worldBounds.top, Math.min(this.y, worldBounds.bottom - this.getHeight()));
    },
    borderEffect: {
        isActive: true,
        draw() {
            let borderWidth = viewport.getFollowBoundaryWidth() / 10;
            let vWidth = viewport.getWidth(),
                vHeight = viewport.getHeight();
            let darkShade = "rgba(0,0,0,1)",
                transparentShade = "rgba(0,0,0,0)";

            let wCS1 = borderWidth / vWidth;
            let grad = ctx.createLinearGradient(0, 0, vWidth, 0);
            grad.addColorStop(0, darkShade);
            grad.addColorStop(wCS1, transparentShade);
            grad.addColorStop(1 - wCS1, transparentShade);
            grad.addColorStop(1, darkShade);

            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, vWidth, vHeight);

            let hCS1 = borderWidth / vHeight;
            grad = ctx.createLinearGradient(0, 0, 0, vHeight);
            grad.addColorStop(0, darkShade);
            grad.addColorStop(hCS1, transparentShade);
            grad.addColorStop(1 - hCS1, transparentShade);
            grad.addColorStop(1, darkShade);

            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, vWidth, vHeight);
        }
    }
}

let backgroundProperties = {
    backgroundColor: "#23262B",
    gridLineColor: "#424852",
    gridScale: 50,
    lineWidth: 1
}

let mainParticle = {
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
    computedAcceleration: 0,
    getAccelerationMagnitude: () => {
        return Math.sqrt(mainParticle.aX ** 2 + mainParticle.aY ** 2);
    },
    getSpeedSquared: () => {
        return mainParticle.vX * mainParticle.vX + mainParticle.vY * mainParticle.vY;
    }
}

let keyStates = {
};

let controls = {
    up: {
        type: "movement",
        keys: ["w"],
        action: () => {
            mainParticle.daY += -1;
        }
    },
    down: {
        keys: ["s"],
        action: () => {
            mainParticle.daY += 1;
        }
    },
    left: {
        keys: ["a"],
        action: () => {
            mainParticle.daX += -1;
        }
    },
    right: {
        keys: ["d"],
        action: () => {
            mainParticle.daX += 1;
        }
    }
};

let hotkeys = {
    pause: {
        keys: ["Escape", " "],
        action: () => {
            toggleAnimation();
        }
    }
}

function activateHotkeyBindings() {
    for (const binding of Object.values(hotkeys)) {
        if (binding.keys.some(k => keyStates[k]))
            binding.action();
    }
}



window.addEventListener("keydown", (event) => {
    keyStates[event.key] = true;
    activateHotkeyBindings();
});

window.addEventListener("keyup", (event) => {
    keyStates[event.key] = false;
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
    ctx.fillStyle = renderBaseColor;
    ctx.fillRect(0, 0, worldBounds.getWidth(), worldBounds.getHeight());
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
        let factor = acceleration / magnitude;
        particle.aX = factor * daX;
        particle.aY = factor * daY;
        particle.computedAcceleration = acceleration;
    } else {
        particle.aX = 0;
        particle.aY = 0;
        particle.computedAcceleration = 0;
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
    updateAcceleration(mainParticle);
    updateVelocity(mainParticle);
    updatePosition(mainParticle);
    applyFriction(mainParticle, frictionCoefficient);
}

function activateControlBindings() {
    for (const controlBinding of Object.values(controls)) {
        if (controlBinding.keys.some(k => keyStates[k]))
            controlBinding.action();
    }
}

// Game logic
function update() {
    activateControlBindings();
    updateStats();
    updateMotion();
    viewport.update();
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

function formatStats(key, value) {
    return [`${key}: ${typeof value === "number" ? round(value) : value}\n`, "white"];
}

function drawStats() {
    drawComplexText(10, 10,
        Object.entries(stats).map(([key, val]) => formatStats(key, val())),
        2);
}

function drawParticle() {
    ctx.beginPath();
    ctx.arc(mainParticle.x, mainParticle.y, mainParticle.size, 0, 2 * Math.PI);
    ctx.fillStyle = mainParticle.color;
    ctx.fill();
}

function drawBackground() {
    let { backgroundColor, gridLineColor, gridScale, lineWidth } = backgroundProperties;

    let { top, bottom, left, right } = worldBounds;

    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, right + worldBounds.borderWidth, bottom + worldBounds.borderWidth);
    ctx.strokeStyle = gridLineColor;
    ctx.lineWidth = lineWidth;

    for (let lineX = left; lineX < right; lineX += (worldBounds.getWidth() - worldBounds.borderWidth) / gridScale) {
        ctx.beginPath();
        ctx.moveTo(lineX, top);
        ctx.lineTo(lineX, bottom);
        ctx.stroke();
    }

    for (let lineY = top; lineY < bottom; lineY += worldBounds.getHeight() / gridScale) {
        ctx.beginPath();
        ctx.moveTo(left, lineY);
        ctx.lineTo(right, lineY);
        ctx.stroke();
    }
}

function drawWorld() {
    drawBackground();
    drawParticle();
}

function drawHUD() {
    if (viewport.borderEffect.isActive)
        viewport.borderEffect.draw();

    if (isStatsVisible)
        drawStats();
}

// Rendering
function draw() {
    clearCanvas();
    ctx.save();
    ctx.translate(-viewport.x, -viewport.y);
    drawWorld();
    ctx.restore();
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

viewport.followTarget = mainParticle;
draw();
startAnimation();