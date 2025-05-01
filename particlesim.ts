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
export let GAME_TIME = 0;

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

abstract class System<Node> {
    nodeMap: Map<EntityID, Node> = new Map<EntityID, Node>();
    constructor() { }
    public addNode(entityID: EntityID, node: Node) {
        this.nodeMap.set(entityID, node);
    }
    public removeNode(entityID: EntityID): boolean {
        return this.nodeMap.delete(entityID);
    }
    public update() {
        this.nodeMap.forEach(this.updateNode);
    }
    public abstract updateNode(node: Node, entityID: EntityID);
}

class SystemManager {
    systemList: System<any>[] = [];
    public add(system: System<any>) {
        this.systemList.push(system);
    }
    public update() {
        this.systemList.forEach(s => s.update());
    }
}

type PositionComponent = {
    position: Vec2;
}

type ScreenPointComponent = {
    point: Vec2;
}

type MovementControlInputComponent = {
    movementControlInput: Vec2
}

type DimensionsComponent = {

}

type WorldComponent = {
    dimensions: Vec2;
    borderWidth: number;
}

type CameraComponent = {
    deadzoneWidth: number;
}

type ComputedSpeedComponent = {
    computedSpeed: number;
}

type ComputedAccelerationComponent = {
    computedAcceleration: number;
}

type KinematicSystemNode = {
    position: Vec2;
    velocity: Vec2;
    acceleration: Vec2;
}

type PositionSystemNode = {
    position: Vec2;
    velocity: Vec2;
}

type CollisionSystemNode = {
    position: Vec2;
    velocity: Vec2;
    particleRadius: number;
    world: WorldComponent;
}

type MovementControlSystemNode = {
    acceleration: Vec2;
    movementControlInputComponent: MovementControlInputComponent;
}

type ViewportSystemNode = {
    positionComponent: PositionComponent;
    dimensions: Vec2;
    targetPosition: Vec2;
    cameraComponent: CameraComponent;
    worldComponent: WorldComponent;
}

type ParticleStatSystemNode = {
    velocity: Vec2;
    acceleration: Vec2;
    computedAcceleration: ComputedAccelerationComponent;
    computedSpeed: ComputedSpeedComponent;
}

type ProjectileSystemNode = {
    world: WorldComponent;
    deathTime: number;
    position: Vec2;
    size: number;
    color: string;
}

type FiringSystemNode = {
    world: WorldComponent;
    particlePosition: Vec2;
    particleVelocity: Vec2;
    particleSize: number;
    lastFireTime: number;
    color: string;
    targetPositionComponent: PositionComponent;
}

type CursorSystemNode = {
    positionComponent: PositionComponent,
    screenPointComponent: ScreenPointComponent,
    viewportPositionComponent: PositionComponent
}

type ProjectileRenderNode = {
    position: Vec2;
    radius: number;
    color: string;
    deathTime: number;
}

type WorldRenderNode = {
    dimensions: Vec2;
    borderWidth: number;
    backgroundColor: string;
    gridSize: number;
    gridLineWidth: number;
    gridLineColor: string;
}

type ParticleRenderNode = {
    position: Vec2;
    size: number;
    color: string;
    targetPositionComponent: PositionComponent;
}

type ViewportRenderNode = {
    dimensions: Vec2;
    cameraComponent: CameraComponent;
}

type StatRenderNode = ParticleStatSystemNode & {
    position: Vec2;
}

class KinematicSystem extends System<KinematicSystemNode> {
    public updateNode(node: KinematicSystemNode, entityID: EntityID) {
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
}
class PositionSystem extends System<PositionSystemNode> {
    public updateNode(node: PositionSystemNode, entityID: EntityID) {
        node.position.x += node.velocity.x * DELTA_TIME;
        node.position.y += node.velocity.y * DELTA_TIME;
    }
}

class CollisionSystem extends System<CollisionSystemNode> {
    public updateNode(node: CollisionSystemNode, entityID: EntityID) {
        let { position, velocity, particleRadius } = node;
        let { x, y } = position;
        let { x: vX, y: vY } = velocity;

        const worldWidth = node.world.dimensions.x,
            worldHeight = node.world.dimensions.y,
            worldCenterX = node.world.dimensions.x / 2,
            worldCenterY = node.world.dimensions.y / 2,
            diffX = worldCenterX - x,
            diffY = worldCenterY - y,
            distanceX = Math.abs(diffX),
            distanceY = Math.abs(diffY),
            distanceXMax = worldWidth / 2 - particleRadius,
            distanceYMax = worldHeight / 2 - particleRadius,
            penetrationCorrectionThreshold = node.world.borderWidth,
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
}

class MovementControlSystem extends System<MovementControlSystemNode> {
    public updateNode(node: MovementControlSystemNode, entityID: EntityID) {
        const { acceleration, movementControlInputComponent: input } = node;
        const { x: iX, y: iY } = input.movementControlInput;
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
    }
}

class ParticleStatSystem extends System<ParticleStatSystemNode> {
    public updateNode(node: ParticleStatSystemNode, entityID: EntityID) {
        node.computedAcceleration.computedAcceleration = Math.sqrt(node.acceleration.x ** 2 + node.acceleration.y ** 2);
        node.computedSpeed.computedSpeed = Math.sqrt(node.velocity.x ** 2 + node.velocity.y ** 2);
    }
}

class ViewportSystem extends System<ViewportSystemNode> {
    public updateNode(node: ViewportSystemNode, entityID: EntityID) {
        let { x, y } = node.positionComponent.position;
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

        const worldBorderWidth = node.worldComponent.borderWidth;
        node.positionComponent.position.x = Math.max(- worldBorderWidth, Math.min(x, node.worldComponent.dimensions.x + worldBorderWidth - width / PIXELS_PER_METER));
        node.positionComponent.position.y = Math.max(- worldBorderWidth, Math.min(y, node.worldComponent.dimensions.y + worldBorderWidth - height / PIXELS_PER_METER));
    }
}

class ProjectileSystem extends System<ProjectileSystemNode> {
    public updateNode(node: ProjectileSystemNode, entityID: EntityID) {
        if (GAME_TIME >= node.deathTime) {
            destroyProjectile(entityID);
            if (node.size <= 0.5)
                return;
            for (let i = 0; i < 2 * Math.PI; i += (2 * Math.PI / 9)) {
                let vX = Math.cos(i) * (0.5 + 0.65 * Math.random());
                let vY = Math.sin(i) * (0.5 + 0.65 * Math.random());
                spawnProjectile(node.world, Vector2.copy(node.position), Vector2.scale({ x: vX, y: vY }, MAX_SPEED), node.size / 2, node.color);
            }
        }
    }
}

class FiringSystem extends System<FiringSystemNode> {
    public updateNode(node: FiringSystemNode, entityID: EntityID) {
        if (GAME_TIME - node.lastFireTime < 1 / PARTICLE_PARAMETERS.projectile.fireRate)
            return
        let direction = Vector2.normalize(Vector2.subtract(node.targetPositionComponent.position, node.particlePosition)),
            position = Vector2.add(node.particlePosition, Vector2.scale(direction, PARTICLE_PARAMETERS.cannon.length)),
            velocity = Vector2.add(Vector2.scale(direction, MAX_SPEED), node.particleVelocity);
        spawnProjectile(node.world, position, velocity, node.particleSize, node.color);
        node.lastFireTime = GAME_TIME;
    }
}

class CursorSystem extends System<CursorSystemNode> {
    public updateNode(node: CursorSystemNode, entityID: EntityID) {
        node.positionComponent.position =
            Vector2.add(
                node.viewportPositionComponent.position,
                Vector2.scale(node.screenPointComponent.point, 1 / PIXELS_PER_METER)
            );
    }
}

class ProjectileRenderSystem extends System<ProjectileRenderNode> {
    public updateNode(node: ProjectileRenderNode, entityID: EntityID) {
        const { x, y } = node.position;
        CONTEXT.save();

        if (node.deathTime - GAME_TIME <= 1) {
            let X = (node.deathTime - GAME_TIME)
            CONTEXT.globalAlpha = lerp(0, Math.sin(1 / (0.01 + X / 10)), 1 - X);
            node.radius *= 1.025;
        }

        CONTEXT.beginPath();
        CONTEXT.arc(x, y, node.radius, 0, 2 * Math.PI);
        CONTEXT.fillStyle = node.color;
        CONTEXT.fill();

        CONTEXT.restore();
    }
}

class WorldRenderSystem extends System<WorldRenderNode> {
    public updateNode(node: WorldRenderNode, entityID: EntityID) {
        const { dimensions, gridLineWidth, gridLineColor, gridSize, backgroundColor, borderWidth } = node;
        const { x: width, y: height } = dimensions;

        CONTEXT.fillStyle = backgroundColor;
        CONTEXT.fillRect(- borderWidth, - borderWidth, width + 2 * borderWidth, height + 2 * borderWidth);
        CONTEXT.strokeStyle = gridLineColor;
        CONTEXT.lineWidth = gridLineWidth;

        for (let vLine = 0; vLine <= width + gridLineWidth; vLine += gridSize) {
            CONTEXT.beginPath();
            CONTEXT.moveTo(vLine, 0);
            CONTEXT.lineTo(vLine, height);
            CONTEXT.stroke();
        }

        for (let hLine = 0; hLine <= height + gridLineWidth; hLine += gridSize) {
            CONTEXT.beginPath();
            CONTEXT.moveTo(0, hLine);
            CONTEXT.lineTo(width, hLine);
            CONTEXT.stroke();
        }
    }
}

class ViewportRenderSystem extends System<ViewportRenderNode> {
    public updateNode(node: ViewportRenderNode, entityID: EntityID) {
        const isActive = true;
        if (!isActive)
            return;

        let borderWidth = node.cameraComponent.deadzoneWidth / 10;
        let vWidth = node.dimensions.x,
            vHeight = node.dimensions.y;
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

class ParticleRenderSystem extends System<ParticleRenderNode> {
    public updateNode(node: ParticleRenderNode, entityID: EntityID) {
        const { x: pX, y: pY } = node.position;
        const pSize = node.size;
        const pCannonWidth = pSize * PARTICLE_PARAMETERS.cannon.width;
        const pCannonLength = pSize * PARTICLE_PARAMETERS.cannon.length;

        CONTEXT.save();

        CONTEXT.translate(pX, pY);

        CONTEXT.save();
        // Begin draw cannon

        CONTEXT.rotate(Vector2.angle(node.position, node.targetPositionComponent.position));
        CONTEXT.translate(0, -pCannonWidth / 2);

        CONTEXT.beginPath();
        CONTEXT.moveTo(0, 0);
        CONTEXT.lineTo(pCannonLength, 0);
        CONTEXT.lineTo(pCannonLength, pCannonWidth);
        CONTEXT.lineTo(0, pCannonWidth);

        CONTEXT.fillStyle = "gray";
        CONTEXT.fill();

        // End draw Cannon
        CONTEXT.restore();

        CONTEXT.beginPath();
        CONTEXT.arc(0, 0, pSize * PARTICLE_PARAMETERS.radius, 0, 2 * Math.PI);
        CONTEXT.fillStyle = node.color;
        CONTEXT.fill();

        CONTEXT.restore();
    }
}

class StatRenderSystem extends System<StatRenderNode> {
    static STATS = {
        isAnimating: (node: StatRenderNode) => isAnimating,
        fps: (node: StatRenderNode) => round(fps),
        position: (node: StatRenderNode) => `${round(node.position.x)}, ${round(node.position.y)}`,
        velocity: (node: StatRenderNode) => `${round(node.computedSpeed.computedSpeed)} (${round(node.velocity.x)}, ${round(node.velocity.y)})`,
        acceleration: (node: StatRenderNode) => `${round(node.computedAcceleration.computedAcceleration)} (${round(node.acceleration.x)}, ${round(node.acceleration.y)})`,
    }

    static formatStats(key: string, value: any) {
        return [`${key}: ${typeof value === "number" ? round(value) : value}\n`, "white"];
    }

    public updateNode(node: StatRenderNode, entityID: EntityID) {
        drawComplexText(10, 10,
            Object.keys(StatRenderSystem.STATS).map((key) => StatRenderSystem.formatStats(key, StatRenderSystem.STATS[key](node))),
            2);
    }
}

export const PARTICLE_PARAMETERS = {
    radius: 0.01,
    projectile: {
        radius: 0.0045,
        speed: MAX_SPEED,
        lifetime: 5, //in seconds
        fireRate: 5 //in shots per second
    },
    cannon: {
        width: 0.01,
        length: 0.02
    }
}

function createParticle(worldComponent: WorldComponent, targetPositionComponent: PositionComponent, movementControlInputComponent: MovementControlInputComponent, color: string, size: number, mass: number, position: Vec2, velocity: Vec2, acceleration: Vec2): EntityID {
    let entityID = createUID(),
        computedSpeed = { computedSpeed: 0 },
        computedAcceleration = { computedAcceleration: 0 }
    kinematicSystem.addNode(entityID, { position, velocity, acceleration });
    positionSystem.addNode(entityID, { position, velocity });
    collisionSystem.addNode(entityID, { position, velocity, particleRadius: size * PARTICLE_PARAMETERS.radius, world: worldComponent });
    movementControlSystem.addNode(entityID, { acceleration, movementControlInputComponent: movementControlInputComponent });
    particleStatSystem.addNode(entityID, { velocity, acceleration, computedSpeed, computedAcceleration });
    statRenderSystem.addNode(entityID, { position, velocity, acceleration, computedAcceleration, computedSpeed })
    firingSystem.addNode(entityID, { world: worldComponent, targetPositionComponent: targetPositionComponent, particlePosition: position, particleVelocity: velocity, particleSize: size, lastFireTime: 0, color });
    particleRenderSystem.addNode(entityID, { position, size, color, targetPositionComponent: targetPositionComponent });
    return entityID;
}

function spawnProjectile(world: WorldComponent, position: Vec2, velocity: Vec2, size: number, color: string): EntityID {
    let entityID = createUID(),
        acceleration = { x: 0, y: 0 },
        deathTime = GAME_TIME + PARTICLE_PARAMETERS.projectile.lifetime;
    kinematicSystem.addNode(entityID, { position, velocity, acceleration });
    positionSystem.addNode(entityID, { position, velocity });
    projectileSystem.addNode(entityID, { world, deathTime, position, size, color });
    projectileRenderSystem.addNode(entityID, { position, radius: PARTICLE_PARAMETERS.projectile.radius * size, color, deathTime });
    collisionSystem.addNode(entityID, { world, position, velocity, particleRadius: PARTICLE_PARAMETERS.projectile.radius * size });
    return entityID;
}

function destroyProjectile(entityID: EntityID) {
    systemManager.systemList.forEach(s => s.removeNode(entityID));
}

const KEY_STATES = {
};

const KEYBOARD_MOVEMENT_CONTROL_INPUT_COMPONENT: MovementControlInputComponent = {
    movementControlInput: {
        x: 0,
        y: 0
    }
}

const KEYBOARD_CONTROLS = {
    up: {
        type: "movement",
        keys: ["w"],
        action: () => {
            KEYBOARD_MOVEMENT_CONTROL_INPUT_COMPONENT.movementControlInput.y += -1;
        }
    },
    down: {
        keys: ["s"],
        action: () => {
            KEYBOARD_MOVEMENT_CONTROL_INPUT_COMPONENT.movementControlInput.y += 1;
        }
    },
    left: {
        keys: ["a"],
        action: () => {
            KEYBOARD_MOVEMENT_CONTROL_INPUT_COMPONENT.movementControlInput.x += -1;
        }
    },
    right: {
        keys: ["d"],
        action: () => {
            KEYBOARD_MOVEMENT_CONTROL_INPUT_COMPONENT.movementControlInput.x += 1;
        }
    }
};

const MOUSE_KEY_STATES = {

}

const MOUSE_CONTROLS = {
    fire: {
        type: "action",
        keys: [0],
        action: () => {
            firingSystem.update();
        }
    }
}

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

function resizeCanvas() {
    canvasWidth = CANVAS_ELEMENT.width = window.innerWidth * .98;
    canvasHeight = CANVAS_ELEMENT.height = window.innerHeight * .98;
}

window.addEventListener("resize", resizeCanvas);

function round(num, decimalPlaces = 3) {
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

function activateControlBindings() {
    KEYBOARD_MOVEMENT_CONTROL_INPUT_COMPONENT.movementControlInput.x = 0;
    KEYBOARD_MOVEMENT_CONTROL_INPUT_COMPONENT.movementControlInput.y = 0;
    for (const controlBinding of Object.keys(KEYBOARD_CONTROLS).map(k => KEYBOARD_CONTROLS[k])) {
        if (controlBinding.keys.some(k => KEY_STATES[k]))
            controlBinding.action();
    }
    for (const controlBinding of Object.keys(MOUSE_CONTROLS).map(k => MOUSE_CONTROLS[k])) {
        if (controlBinding.keys.some(k => MOUSE_KEY_STATES[k]))
            controlBinding.action();
    }
}

// Game logic
function update() {
    cursorSystem.update();
    activateControlBindings();
    updateStats();
    projectileSystem.update();
    movementControlSystem.update();
    kinematicSystem.update();
    collisionSystem.update();
    positionSystem.update();
    particleStatSystem.update();
    viewportSystem.update();
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

function drawWorld() {
    worldRenderSystem.update();
    projectileRenderSystem.update();
    particleRenderSystem.update();
}

function drawPauseScreen() {
    CONTEXT.save();

    CONTEXT.globalAlpha = 0.5;
    CONTEXT.fillStyle = RENDER_BASE_COLOR;
    CONTEXT.fillRect(0, 0, canvasWidth, canvasHeight);
    CONTEXT.globalAlpha = 0.5;
    CONTEXT.font = "bold 256px calibri"
    CONTEXT.fillStyle = "white";
    CONTEXT.fillText("⏸", (canvasWidth - 256) / 2, canvasHeight / 2);

    CONTEXT.restore();
}

function drawHUD() {
    viewportRenderSystem.update();

    if (isStatsVisible)
        statRenderSystem.update();

    if (!isAnimating)
        drawPauseScreen();
}

// Rendering
function draw() {
    clearCanvas();
    CONTEXT.save();
    CONTEXT.scale(PIXELS_PER_METER, PIXELS_PER_METER);
    CONTEXT.translate(-VIEWPORT_POSITION.position.x, -VIEWPORT_POSITION.position.y);
    drawWorld();
    CONTEXT.restore();
    drawHUD();
}

// Game loop
function animate() {
    update();
    draw();
    if (isAnimating)
        requestAnimationFrame(animate);
    GAME_TIME += DELTA_TIME;
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

let kinematicSystem = new KinematicSystem(),
    positionSystem = new PositionSystem(),
    collisionSystem = new CollisionSystem(),
    movementControlSystem = new MovementControlSystem(),
    viewportSystem = new ViewportSystem(),
    projectileSystem = new ProjectileSystem(),
    particleStatSystem = new ParticleStatSystem(),
    firingSystem = new FiringSystem(),
    cursorSystem = new CursorSystem(),
    worldRenderSystem = new WorldRenderSystem(),
    projectileRenderSystem = new ProjectileRenderSystem(),
    particleRenderSystem = new ParticleRenderSystem(),
    viewportRenderSystem = new ViewportRenderSystem(),
    statRenderSystem = new StatRenderSystem();

let systemManager = new SystemManager();
systemManager.systemList.push(
    kinematicSystem,
    positionSystem,
    collisionSystem,
    movementControlSystem,
    viewportSystem,
    projectileSystem,
    particleStatSystem,
    firingSystem,
    cursorSystem,
    worldRenderSystem,
    projectileRenderSystem,
    particleRenderSystem,
    viewportRenderSystem,
    statRenderSystem
);

let VIEWPORT_POSITION: PositionComponent;

function init() {
    const WORLD = {
        borderWidth: 0.1,
        dimensions: {
            x: 4.096,
            y: 2.048
        },
        backgroundColor: "#23262B",
        gridLineColor: "#424852",
        gridSize: 0.032,
        lineWidth: 0.001
    }

    const CURSOR = {
        positionComponent: {
            position: { x: 0, y: 0 }
        },
        screenPointComponent: {
            point: { x: 0, y: 0 }
        }
    }

    const TANK = {
        color: "red",
        size: 2,
        mass: 10,
        position: {
            x: WORLD.dimensions.x / 2,
            y: WORLD.dimensions.y / 2
        },
        velocity: {
            x: 0,
            y: 0
        },
        acceleration: {
            x: 0,
            y: 0
        },
        computedSpeed: 0,
        computedAcceleration: 0,
    }

    const VIEWPORT = {
        positionComponent: {
            position: {
                x: (WORLD.dimensions.x - canvasWidth) / (2 * PIXELS_PER_METER),
                y: (WORLD.dimensions.y - canvasHeight) / (2 * PIXELS_PER_METER),
            }
        },
        dimensions: {
            x: canvasWidth,
            y: canvasHeight
        },
        cameraComponent: {
            deadzoneWidth: 0.25 * Math.min(canvasWidth, canvasHeight)
        },
        targetPosition: TANK.position,
    }

    VIEWPORT_POSITION = VIEWPORT.positionComponent;

    let worldComponent: WorldComponent = {
        borderWidth: WORLD.borderWidth,
        dimensions: { ...WORLD.dimensions }
    }

    worldRenderSystem.addNode(createUID(), {
        borderWidth: WORLD.borderWidth,
        dimensions: { ...WORLD.dimensions },
        backgroundColor: WORLD.backgroundColor,
        gridSize: WORLD.gridSize,
        gridLineWidth: WORLD.lineWidth,
        gridLineColor: WORLD.gridLineColor
    });

    viewportSystem.addNode(createUID(), {
        positionComponent: VIEWPORT.positionComponent,
        dimensions: VIEWPORT.dimensions,
        targetPosition: TANK.position,
        worldComponent: worldComponent,
        cameraComponent: VIEWPORT.cameraComponent
    });

    viewportRenderSystem.addNode(createUID(), {
        dimensions: VIEWPORT.dimensions,
        cameraComponent: VIEWPORT.cameraComponent
    });

    cursorSystem.addNode(createUID(), {
        positionComponent: CURSOR.positionComponent,
        viewportPositionComponent: VIEWPORT.positionComponent,
        screenPointComponent: CURSOR.screenPointComponent
    });

    createParticle(worldComponent, CURSOR.positionComponent, KEYBOARD_MOVEMENT_CONTROL_INPUT_COMPONENT, TANK.color, TANK.size, TANK.mass, TANK.position, TANK.velocity, TANK.acceleration);

    (() => {
        let entityID = createUID(),
            targetPositionComponent = { position: TANK.position },
            position = Vector2.add(Vector2.copy(TANK.position), { x: 0.03, y: 0 }),
            velocity = { x: 0, y: 0 },
            acceleration = { x: 0, y: 0 },
            color = "blue",
            size = 2.5
            ;
        kinematicSystem.addNode(entityID, { position, velocity, acceleration });
        positionSystem.addNode(entityID, { position, velocity });
        collisionSystem.addNode(entityID, { position, velocity, particleRadius: size * PARTICLE_PARAMETERS.radius, world: worldComponent });
        particleRenderSystem.addNode(entityID, { position, size, color, targetPositionComponent: targetPositionComponent });
        // firingSystem.addNode(entityID, { world: worldComponent, targetPositionComponent: targetPositionComponent, particlePosition: position, particleVelocity: velocity, particleSize: size, lastFireTime: 0, color });
    })();

    window.addEventListener("keydown", (event) => {
        KEY_STATES[event.key] = true;
        activateHotkeyBindings();
    });

    window.addEventListener("keyup", (event) => {
        KEY_STATES[event.key] = false;
    });

    window.addEventListener("mousedown", (event: MouseEvent) => {
        MOUSE_KEY_STATES[event.button] = true;
    });

    CANVAS_ELEMENT.addEventListener("mouseup", (event: MouseEvent) => {
        MOUSE_KEY_STATES[event.button] = false;
    });

    CANVAS_ELEMENT.addEventListener("mousemove", (event) => {
        let { offsetX: x, offsetY: y } = event;
        CURSOR.screenPointComponent.point = { x, y };
    });

    animate();
}

init();