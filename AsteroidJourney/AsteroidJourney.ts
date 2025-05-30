import { Vec2, Vector2, EntityID, Entity, Component, System, SystemPhase } from "../engine/FluidECS.js";
import { FluidEngine } from "../engine/FluidEngine.js";

var engine = new FluidEngine();

const CANVAS_ELEMENT = document.getElementById("canvas")! as HTMLCanvasElement;
const CONTEXT = CANVAS_ELEMENT.getContext("2d")!;
let canvasWidth = CANVAS_ELEMENT.width,
    canvasHeight = CANVAS_ELEMENT.height;

CANVAS_ELEMENT.addEventListener('contextmenu', function (e) {
    e.preventDefault();
});

resizeCanvas();

let isStatsVisible = true;
const RENDER_BASE_COLOR = "black";
const TEXT_METRICS = CONTEXT.measureText("A");
const FONT_HEIGHT = TEXT_METRICS.actualBoundingBoxAscent + TEXT_METRICS.actualBoundingBoxDescent;

export const PIXELS_PER_METER = 1000;

export const ACCELERATION = 1 / Math.E;
export const GRAVITY = 9.81;

const FPS_CALCULATION_INTERVAL = 20;
let lastFrameTime = 0;
let fpsFrameCounter = 0;
let fps = 0;

type ResolutionComponent = Component & {
    resolution: Vec2;
}

type PositionComponent = Component & {
    position: Vec2;
    rotation: number;
}

type TargetPositionComponent = Component & {
    targetPosition: Vec2;
}

type VelocityComponent = Component & {
    velocity: Vec2;
    angular: number;
}

type AccelerationComponent = Component & {
    acceleration: Vec2;
    angular: number;
}

type ScreenPointComponent = Component & {
    point: Vec2;
}

type CameraSpeedFactorComponent = Component & {
    speedFactor: number;
}

type ViewportBorderWidthComponent = Component & {
    borderWidth: number;
}

type MovementControlComponent = Component & {
    acceleration: Vec2;
    yawControl: boolean;
}

type WorldComponent = Component & {
    resolution: Vec2;
    borderWidth: number;
    backgroundColor: string;
}

type BackgroundGridComponent = Component & {
    gridSize: number;
    gridLineWidth: number;
    gridLineColor: string;
}

type ComputedSpeedComponent = Component & {
    computedSpeed: number;
}

type ComputedAccelerationComponent = Component & {
    computedAcceleration: number;
}

type ParticleComponent = Component & {
    radius: number;
    color: string;
}

type ProjectileComponent = Component & {
    generation: number;
    deathTime: number;
}

type FireControlComponent = Component & {
    fireIntent: boolean;
}

type ProjectileSourceComponent = Component & {
    muzzleSpeed: number;
    lastFireTime: number;
}

type CursorTranslateComponent = Component & {
    cursorTranslate: Vec2;
}

type ParticleStatsComponent = Component & {
    position: Vec2;
    velocity: Vec2;
    acceleration: Vec2;
    computedAcceleration: number;
    computedSpeed: number;
}

type KinematicSystemNode = {
    position: PositionComponent;
    velocity: VelocityComponent;
    acceleration: AccelerationComponent;
}

type PositionSystemNode = {
    position: PositionComponent;
    velocity: VelocityComponent;
}

type CollisionSystemNode = {
    position: PositionComponent;
    velocity: VelocityComponent;
    particle: ParticleComponent;
    world: WorldComponent;
}

type MovementControlSystemNode = {
    position: PositionComponent;
    velocity: VelocityComponent;
    acceleration: AccelerationComponent;
    movementControl: MovementControlComponent;
    targetPosition: TargetPositionComponent;
}

type ViewportSystemNode = {
    position: PositionComponent;
    resolution: ResolutionComponent;
    targetPosition: TargetPositionComponent;
    speedFactor: CameraSpeedFactorComponent;
    world: WorldComponent;
}

type ParticleStatSystemNode = {
    particleStats: ParticleStatsComponent;
}

type ProjectileSystemNode = {
    projectile: ProjectileComponent;
    particle: ParticleComponent;
    world: WorldComponent;
    position: PositionComponent;
}

type FiringSystemNode = {
    world: WorldComponent;
    particle: ParticleComponent;
    projectileSource: ProjectileSourceComponent;
    fireControl: FireControlComponent;
    targetPosition: TargetPositionComponent;
    velocity: VelocityComponent;
    position: PositionComponent;
}

type CursorSystemNode = {
    position: PositionComponent;
    screenPoint: ScreenPointComponent;
    cursorTranslate: CursorTranslateComponent;
}

type ProjectileRenderNode = {
    projectile: ProjectileComponent;
    particle: ParticleComponent;
    position: PositionComponent;
}

type WorldRenderNode = {
    world: WorldComponent;
    backgroundGrid: BackgroundGridComponent;
}

type ParticleRenderNode = {
    particle: ParticleComponent;
    position: PositionComponent;
    targetPosition: TargetPositionComponent;
}

type ViewportRenderNode = {
    resolution: ResolutionComponent;
    borderWidth: ViewportBorderWidthComponent;
}

type StatRenderNode = ParticleStatSystemNode & {
}

class KinematicSystem extends System<KinematicSystemNode> {
    NODE_COMPONENT_KEYS: Set<keyof KinematicSystemNode> = new Set(['position', 'acceleration', 'velocity']);
    public updateNode(node: KinematicSystemNode, entityID: EntityID) {
        const g = GRAVITY;
        const DELTA_TIME = engine.getDeltaTime();
        const { velocity, acceleration } = node;
        let { x: vX, y: vY } = velocity.velocity;

        // Apply acceleration
        vX += acceleration.acceleration.x * DELTA_TIME;
        vY += acceleration.acceleration.y * DELTA_TIME;
        let speed = Math.sqrt(vX ** 2 + vY ** 2);

        velocity.velocity.x = vX;
        velocity.velocity.y = vY;
        velocity.angular += acceleration.angular * DELTA_TIME;
    }
}

class CollisionSystem extends System<CollisionSystemNode> {
    NODE_COMPONENT_KEYS: Set<keyof CollisionSystemNode> = new Set(['particle', 'position', 'velocity', 'world']);
    public updateNode(node: CollisionSystemNode, entityID: EntityID) {
        const DELTA_TIME = engine.getDeltaTime();
        let { position, velocity, particle, world } = node;
        let particleRadius = particle.radius;
        let { x, y } = position.position;
        let { x: vX, y: vY } = velocity.velocity;


        const worldWidth = world.resolution.x,
            worldHeight = world.resolution.y,
            worldCenterX = worldWidth / 2,
            worldCenterY = worldHeight / 2,
            diffX = worldCenterX - x,
            diffY = worldCenterY - y,
            distanceX = Math.abs(diffX),
            distanceY = Math.abs(diffY),
            distanceXMax = worldWidth / 2 - particleRadius,
            distanceYMax = worldHeight / 2 - particleRadius,
            penetrationCorrectionThreshold = world.borderWidth,
            penetrationDistanceX = distanceXMax + penetrationCorrectionThreshold,
            penetrationDistanceY = distanceYMax + penetrationCorrectionThreshold;

        if (distanceX > distanceXMax) {
            let direction = Math.sign(diffX);
            velocity.velocity.x = direction * (Math.abs(vX) + +(distanceX > penetrationDistanceX) * DELTA_TIME * ACCELERATION * distanceX / penetrationDistanceX);
        }

        if (distanceY > distanceYMax) {
            let direction = Math.sign(diffY);
            velocity.velocity.y = direction * (Math.abs(vY) + +(distanceY > penetrationDistanceY) * DELTA_TIME * ACCELERATION * distanceY / penetrationDistanceY);
        }
    }
}

class MovementControlSystem extends System<MovementControlSystemNode> {
    NODE_COMPONENT_KEYS: Set<keyof MovementControlSystemNode> = new Set(['position', 'velocity', 'acceleration', 'movementControl', 'targetPosition']);
    public updateNode(node: MovementControlSystemNode, entityID: EntityID) {
        const DELTA_TIME = engine.getDeltaTime();
        const { acceleration, movementControl: input } = node;
        const { x: iX, y: iY } = input.acceleration;
        const rot = node.position.rotation;

        const THRUST_ACCELERATION = 1;
        const ANGULAR_ACCELERATION = 23;
        const ROLL_ACCELERATION = 1 / 4;


        let vAngular = node.velocity.angular;
        if (node.movementControl.yawControl) {
            let angleWithTarget = Vector2.angle(node.position.position, node.targetPosition.targetPosition);
            let rot = node.position.rotation;
            let diff = angleWithTarget - rot;
            let pi = Math.PI
            vAngular += DELTA_TIME * ANGULAR_ACCELERATION * (((diff + pi) % (2 * pi) + 2 * pi) % (2 * pi) - pi);
        }


        node.acceleration.acceleration.x = 0;
        node.acceleration.acceleration.y = 0;

        let thrust = -iY;
        if (thrust) {
            node.acceleration.acceleration = Vector2.scale({ x: Math.cos(rot), y: Math.sin(rot) }, thrust * THRUST_ACCELERATION);
        }


        let roll = iX;
        if (roll) {
            let rollVecAngle = rot + roll * Math.PI / 2;
            let rollAccelerationVec = Vector2.scale(Vector2.fromAngle(rollVecAngle), ROLL_ACCELERATION);
            acceleration.acceleration = Vector2.add(acceleration.acceleration, rollAccelerationVec);
        }
        node.velocity.angular = vAngular;
    }
}

class PositionSystem extends System<PositionSystemNode> {
    NODE_COMPONENT_KEYS: Set<keyof PositionSystemNode> = new Set(['position', 'velocity']);
    public updateNode(node: PositionSystemNode, entityID: EntityID) {
        const DELTA_TIME = engine.getDeltaTime();
        node.position.position.x += node.velocity.velocity.x * DELTA_TIME;
        node.position.position.y += node.velocity.velocity.y * DELTA_TIME;
        node.position.rotation += node.velocity.angular * DELTA_TIME;

        const ANGULAR_VELOCITY_DECAY_FACTOR = 10;
        node.velocity.angular = lerp(node.velocity.angular, 0, ANGULAR_VELOCITY_DECAY_FACTOR * DELTA_TIME);
    }
}

class ParticleStatSystem extends System<ParticleStatSystemNode> {
    NODE_COMPONENT_KEYS: Set<keyof ParticleStatSystemNode> = new Set(['particleStats']);
    public updateNode(node: ParticleStatSystemNode, entityID: EntityID) {
        let stats = node.particleStats;
        stats.computedSpeed = Vector2.magnitude(stats.velocity);
        stats.computedAcceleration = Vector2.magnitude(stats.acceleration);
    }
}

class ViewportSystem extends System<ViewportSystemNode> {
    NODE_COMPONENT_KEYS: Set<keyof ViewportSystemNode> = new Set(['position', 'resolution', 'targetPosition', 'speedFactor', 'world']);
    public updateNode(node: ViewportSystemNode, entityID: EntityID) {
        const DELTA_TIME = engine.getDeltaTime();
        // const deadzoneWidth = node.deadzone.width / PIXELS_PER_METER;//Deadzone width in world units
        const res = Vector2.scale(node.resolution.resolution, 1 / PIXELS_PER_METER);//Viewport resolution in world units
        const resCenter = Vector2.scale(res, 1 / 2);//Untranslated viewport center in world units
        const centerPos = Vector2.add(node.position.position, resCenter); //World coordinates of viewport center
        // const maxDist = Vector2.subtract(resCenter, { x: deadzoneWidth, y: deadzoneWidth });//Maximum x and y distances from coordinates of viewport center in world
        const diff = Vector2.subtract(node.targetPosition.targetPosition, centerPos);
        const dist = Vector2.abs(diff);
        const moveDir = Vector2.normalize(diff);

        if (dist.x > 0 || dist.y > 0) {
            const moveVec = Vector2.multiply(moveDir, dist); // move proportional to how much target exceeded deadzone
            const moveStep = Vector2.scale(moveVec, node.speedFactor.speedFactor * DELTA_TIME);
            node.position.position = Vector2.add(node.position.position, moveStep);
        }
    }
}

class ProjectileSystem extends System<ProjectileSystemNode> {
    NODE_COMPONENT_KEYS: Set<keyof ProjectileSystemNode> = new Set(['projectile', 'particle', 'world', 'position']);
    public updateNode(node: ProjectileSystemNode, entityID: EntityID) {
        const GAME_TIME = engine.getGameTime();

        if (GAME_TIME >= node.projectile.deathTime) {
            destroyProjectile(entityID);
            // if (node.projectile.generation == 2)
            //     return;
            // for (let i = 0; i < 2 * Math.PI; i += (2 * Math.PI / 9)) {
            //     let vX = Math.cos(i) * (0.5 + 0.65 * Math.random());
            //     let vY = Math.sin(i) * (0.5 + 0.65 * Math.random());
            //     spawnProjectile(
            //         node.world,
            //         Vector2.copy(node.position.position),
            //         Vector2.scale({ x: vX, y: vY }, MAX_SPEED),
            //         node.particle.color,
            //         node.particle.radius * PARTICLE_PARAMETERS.projectile.radius / PARTICLE_PARAMETERS.radius,
            //         GAME_TIME + PARTICLE_PARAMETERS.projectile.lifetime,
            //         node.projectile.generation + 1
            //     );
            // }
        }
    }
}

class FiringSystem extends System<FiringSystemNode> {
    NODE_COMPONENT_KEYS: Set<keyof FiringSystemNode> = new Set(['world', 'particle', 'projectileSource', 'fireControl', 'targetPosition', 'velocity', 'position']);
    public updateNode(node: FiringSystemNode, entityID: EntityID) {
        const GAME_TIME = engine.getGameTime();
        if (!node.fireControl.fireIntent)
            return;

        node.fireControl.fireIntent = false;

        if (GAME_TIME - node.projectileSource.lastFireTime < 1 / PARTICLE_PARAMETERS.projectile.fireRate)
            return

        let direction = { x: Math.cos(node.position.rotation), y: Math.sin(node.position.rotation) },
            position = Vector2.add(node.position.position, Vector2.scale(direction, SHIP_PARAMETERS.bowLength)),
            velocity = Vector2.add(Vector2.scale(direction, node.projectileSource.muzzleSpeed), node.velocity.velocity);

        spawnProjectile(
            node.world,
            position,
            velocity,
            node.particle.color,
            node.particle.radius * PARTICLE_PARAMETERS.projectile.radius / PARTICLE_PARAMETERS.radius,
            GAME_TIME + PARTICLE_PARAMETERS.projectile.lifetime,
            1
        );
        node.projectileSource.lastFireTime = GAME_TIME;
    }
}

class CursorSystem extends System<CursorSystemNode> {
    NODE_COMPONENT_KEYS: Set<keyof CursorSystemNode> = new Set(['position', 'screenPoint', 'cursorTranslate']);
    public updateNode(node: CursorSystemNode, entityID: EntityID) {
        node.position.position =
            Vector2.add(
                node.cursorTranslate.cursorTranslate,
                Vector2.scale(node.screenPoint.point, 1 / PIXELS_PER_METER)
            );
    }
}

class ProjectileRenderSystem extends System<ProjectileRenderNode> {
    NODE_COMPONENT_KEYS: Set<keyof ProjectileRenderNode> = new Set(['projectile', 'position', 'particle']);
    public updateNode(node: ProjectileRenderNode, entityID: EntityID) {
        const GAME_TIME = engine.getGameTime();
        const { x, y } = node.position.position;
        CONTEXT.save();
        let scale = 1;

        if (node.projectile.deathTime - GAME_TIME <= 1) {
            let X = (node.projectile.deathTime - GAME_TIME)
            CONTEXT.globalAlpha = lerp(0, Math.sin(1 / (0.01 + X / 10)), 1 - X);

            if (node.projectile.generation < 2)
                scale = lerp(1, 1.5, 1 - X);
            else
                scale = lerp(1, 0, 1 - X);
        }

        CONTEXT.beginPath();
        CONTEXT.arc(x, y, scale * node.particle.radius, 0, 2 * Math.PI);
        CONTEXT.fillStyle = node.particle.color;
        CONTEXT.fill();

        CONTEXT.restore();
    }
}

class WorldRenderSystem extends System<WorldRenderNode> {
    NODE_COMPONENT_KEYS: Set<keyof WorldRenderNode> = new Set(['world', 'backgroundGrid']);
    public updateNode(node: WorldRenderNode, entityID: EntityID) {
        const { resolution, backgroundColor, borderWidth } = node.world;
        const { gridLineWidth, gridLineColor, gridSize } = node.backgroundGrid;
        const { x: width, y: height } = resolution;

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
    NODE_COMPONENT_KEYS: Set<keyof ViewportRenderNode> = new Set(['resolution', 'borderWidth']);
    public updateNode(node: ViewportRenderNode, entityID: EntityID) {
        const isActive = true;
        if (!isActive)
            return;

        let borderWidth = node.borderWidth.borderWidth;
        let vWidth = node.resolution.resolution.x,
            vHeight = node.resolution.resolution.y;
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
    NODE_COMPONENT_KEYS: Set<keyof ParticleRenderNode> = new Set(['particle', 'position', 'targetPosition']);
    public updateNode(node: ParticleRenderNode, entityID: EntityID) {
        const { x: pX, y: pY } = node.position.position;
        const pSize = node.particle.radius / PARTICLE_PARAMETERS.radius;
        const width = SHIP_PARAMETERS.width * pSize, hW = width / 2;
        const length = SHIP_PARAMETERS.bowLength * pSize;

        CONTEXT.save();

        CONTEXT.translate(pX, pY);

        CONTEXT.save();

        CONTEXT.rotate(node.position.rotation);
        CONTEXT.beginPath();

        CONTEXT.moveTo(length, 0);
        CONTEXT.lineTo(0, -hW);
        CONTEXT.lineTo(-hW, 0);
        CONTEXT.lineTo(0, hW);

        CONTEXT.fillStyle = "gray";
        CONTEXT.fill();

        CONTEXT.restore();

        CONTEXT.beginPath();
        CONTEXT.arc(0, 0, node.particle.radius, 0, 2 * Math.PI);
        CONTEXT.fillStyle = node.particle.color;
        CONTEXT.fill();

        CONTEXT.restore();
    }
}

class StatRenderSystem extends System<StatRenderNode> {
    NODE_COMPONENT_KEYS: Set<keyof StatRenderNode> = new Set(['particleStats']);
    static STATS = {
        isAnimating: (node: StatRenderNode) => engine.getAnimationState(),
        fps: (node: StatRenderNode) => round(fps),
        position: (node: StatRenderNode) => `${round(node.particleStats.position.x)}, ${round(node.particleStats.position.y)}`,
        velocity: (node: StatRenderNode) => `${round(node.particleStats.computedSpeed)} (${round(node.particleStats.velocity.x)}, ${round(node.particleStats.velocity.y)})`,
        acceleration: (node: StatRenderNode) => `${round(node.particleStats.computedAcceleration)} (${round(node.particleStats.acceleration.x)}, ${round(node.particleStats.acceleration.y)})`,
    }

    static formatStats(key: string, value: any) {
        return [`${key}: ${typeof value === "number" ? round(value) : value}\n`, "white"];
    }

    public updateNode(node: StatRenderNode, entityID: EntityID) {
        if (!isStatsVisible)
            return;
        drawComplexText(10, 10,
            Object.keys(StatRenderSystem.STATS).map((key) => StatRenderSystem.formatStats(key, StatRenderSystem.STATS[key](node))),
            2);
    }
}

export const PARTICLE_PARAMETERS = {
    radius: 0.01,
    projectile: {
        radius: 0.0045,
        lifetime: 5, //in seconds
        fireRate: 5 //in shots per second
    },
    cannon: {
        width: 0.01,
        length: 0.02
    }
}

export const SHIP_PARAMETERS = {
    bowLength: 0.045,
    width: 0.035
}

function createParticle(worldComponent: WorldComponent, particleComponent: ParticleComponent, positionComponent: PositionComponent, velocityComponent: VelocityComponent, accelerationComponent: AccelerationComponent, options?: { movementControlComponent?: MovementControlComponent, targetPositionComponent?: TargetPositionComponent }): Entity {
    let computedSpeedComponent = { key: "computedSpeed", computedSpeed: 0 },
        computedAccelerationComponent = { key: "computedAcceleration", computedAcceleration: 0 };
    let entity = engine.createEntity(
        particleComponent,
        positionComponent,
        velocityComponent,
        accelerationComponent,
        worldComponent,
        computedSpeedComponent,
        computedAccelerationComponent,
        {
            key: "projectileSource",
            lastFireTime: 0,
            muzzleSpeed: 2,
        } as ProjectileSourceComponent
    );
    if (options) {
        for (let component of Object.values(options))
            if (component)
                entity.addComponent(component);
    }
    return entity;
}

function spawnProjectile(worldComponent: WorldComponent, position: Vec2, velocity: Vec2, color: string, radius: number, deathTime: number, generation: number): Entity {
    return engine.createEntity(
        worldComponent,
        {
            key: 'position',
            position: position
        } as PositionComponent,
        {
            key: 'velocity',
            velocity: velocity
        } as VelocityComponent,
        {
            key: 'particle',
            color: color,
            radius: radius
        } as ParticleComponent,
        {
            key: 'projectile',
            deathTime: deathTime,
            generation: generation
        } as ProjectileComponent,
        {
            key: 'acceleration',
            acceleration: { x: 0, y: 0 }
        } as AccelerationComponent);
}

function destroyProjectile(entityID: EntityID) {
    engine.removeEntity(entityID);
}

const KEY_STATES = {
};

const MOVEMENT_CONTROL_COMPONENT: MovementControlComponent = {
    key: 'movementControl',
    acceleration: {
        x: 0,
        y: 0
    },
    yawControl: false
}

const KEYBOARD_CONTROLS = {
    up: {
        type: "movement",
        keys: ["w"],
        action: () => {
            MOVEMENT_CONTROL_COMPONENT.acceleration.y += -1;
        }
    },
    down: {
        keys: ["s"],
        action: () => {
            MOVEMENT_CONTROL_COMPONENT.acceleration.y += 1;
        }
    },
    left: {
        keys: ["a"],
        action: () => {
            MOVEMENT_CONTROL_COMPONENT.acceleration.x += -1;
        }
    },
    right: {
        keys: ["d"],
        action: () => {
            MOVEMENT_CONTROL_COMPONENT.acceleration.x += 1;
        }
    }
};

const MOUSE_KEY_STATES = {

}

const MOUSE_CONTROLS = {
}

const HOTKEYS = {
    pause: {
        keys: ["Escape", " "],
        action: () => {
            engine.toggleAnimation();
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
    MOVEMENT_CONTROL_COMPONENT.acceleration.x = 0;
    MOVEMENT_CONTROL_COMPONENT.acceleration.y = 0;
    for (const controlBinding of Object.keys(KEYBOARD_CONTROLS).map(k => KEYBOARD_CONTROLS[k])) {
        if (controlBinding.keys.some(k => KEY_STATES[k]))
            controlBinding.action();
    }
    for (const controlBinding of Object.keys(MOUSE_CONTROLS).map(k => MOUSE_CONTROLS[k])) {
        if (controlBinding.keys.some(k => MOUSE_KEY_STATES[k]))
            controlBinding.action();
    }
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

let logicPhase = {
    key: 'logic',
    order: 0,
    preUpdate() {
        activateControlBindings();
        updateStats();
    },
    postUpdate() {
        MOVEMENT_CONTROL_COMPONENT.yawControl = false;
    }
} as SystemPhase

let worldRender = {
    key: 'worldrender',
    order: 1,
    preUpdate() {
        clearCanvas();
        CONTEXT.save();
        CONTEXT.scale(PIXELS_PER_METER, PIXELS_PER_METER);
        CONTEXT.translate(-VIEWPORT_POSITION.position.x, -VIEWPORT_POSITION.position.y);
    },
    postUpdate() {
        CONTEXT.restore();
    }
} as SystemPhase

let hudRender = {
    key: 'hudrender',
    order: 2,
    postUpdate() {
        if (!engine.getAnimationState())
            drawPauseScreen();
    }
} as SystemPhase

engine.addPhase(logicPhase, worldRender, hudRender);

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

engine.appendSystems(logicPhase,
    cursorSystem,
    firingSystem,
    projectileSystem,
    movementControlSystem,
    kinematicSystem,
    collisionSystem,
    positionSystem,
    particleStatSystem,
    viewportSystem
);

engine.appendSystems(worldRender,
    worldRenderSystem,
    projectileRenderSystem,
    particleRenderSystem
);

engine.appendSystems(hudRender,
    viewportRenderSystem,
    statRenderSystem
);



let VIEWPORT_POSITION: PositionComponent;
let FIRE_CONTROL: FireControlComponent;

function init() {
    // WORLD
    let worldComponent: WorldComponent = {
        key: "world",
        resolution: {
            x: 4.096,
            y: 4.096
        },
        borderWidth: 0.1,
        backgroundColor: "#23262B",
    }
    let backgroundGridComponent: BackgroundGridComponent = {
        key: "backgroundGrid",
        gridSize: 0.032,
        gridLineColor: "#424852",
        gridLineWidth: 0.001
    }


    let particle1PositionComponent: PositionComponent = {
        key: "position",
        position: Vector2.scale(worldComponent.resolution, 1 / 2),
        rotation: 0
    };

    (() => {
        let particleComponent1: ParticleComponent = {
            key: "particle",
            radius: PARTICLE_PARAMETERS.radius * 3,
            color: "red"
        }
        let velocityComponent1: VelocityComponent = {
            key: "velocity",
            velocity: { x: 0, y: 0 },
            angular: 0
        }
        let accelerationComponent1: AccelerationComponent = {
            key: "acceleration",
            acceleration: { x: 0, y: 0 },
            angular: 0
        }
        let FIRE_CONTROL = {
            key: 'fireControl',
            fireIntent: false
        } as FireControlComponent;

        let cursorPositionAsTarget = {
            key: "targetPosition",
            get targetPosition() {
                return cursorPositionComponent.position;
            }
        };

        let mainParticle = createParticle(
            worldComponent,
            particleComponent1,
            particle1PositionComponent,
            velocityComponent1,
            accelerationComponent1,
            {
                movementControlComponent: MOVEMENT_CONTROL_COMPONENT,
                targetPositionComponent: cursorPositionAsTarget
            }
        );

        engine.addEntityComponents(mainParticle,
            {
                key: 'particleStats',
                get position() {
                    return particle1PositionComponent.position;
                },
                get velocity() {
                    return velocityComponent1.velocity;
                },
                get acceleration() {
                    return accelerationComponent1.acceleration;
                },
                computedSpeed: Vector2.magnitude(velocityComponent1.velocity),
                computedAcceleration: Vector2.magnitude(accelerationComponent1.acceleration)
            } as ParticleStatsComponent,
            FIRE_CONTROL
        );

        MOUSE_CONTROLS["fire"] = {
            keys: [0],
            action: () => {
                FIRE_CONTROL.fireIntent = true;
            },
        }

        MOUSE_CONTROLS["yaw"] = {
            keys: [2],
            action: () => {
                MOVEMENT_CONTROL_COMPONENT.yawControl = true;
            }
        }

        let particleComponent2: ParticleComponent = {
            key: "particle",
            radius: 2 * PARTICLE_PARAMETERS.radius,
            color: "blue"
        };

        createParticle(
            worldComponent,
            particleComponent2,
            {
                key: "position",
                position: Vector2.add(particle1PositionComponent.position, { x: 0.08, y: 0 }),
                rotation: 0
            },
            {
                key: "velocity",
                velocity: { x: 0, y: 0 },
                angular: 0
            },
            {
                key: "acceleration",
                acceleration: { x: 0, y: 0 },
                angular: 0
            },
            {
                targetPositionComponent: {
                    key: "targetPosition",
                    get targetPosition() {
                        return particle1PositionComponent.position;
                    }
                }
            }
        );
    })();

    VIEWPORT_POSITION = {
        key: "position",
        position: {
            x: (worldComponent.resolution.x - canvasWidth) / (2 * PIXELS_PER_METER),
            y: (worldComponent.resolution.y - canvasHeight) / (2 * PIXELS_PER_METER),
        }
    } as PositionComponent

    let viewport = engine.createEntity(
        VIEWPORT_POSITION,
        {
            key: "resolution",
            resolution: {
                x: canvasWidth,
                y: canvasHeight
            }
        } as ResolutionComponent,
        {
            key: "targetPosition",
            targetPosition: particle1PositionComponent.position
        } as TargetPositionComponent,
        {
            key: "borderWidth",
            borderWidth: 0.05 * Math.min(canvasWidth, canvasHeight)
        } as ViewportBorderWidthComponent,
        {
            key: "speedFactor",
            speedFactor: 22
        } as CameraSpeedFactorComponent,
        worldComponent
    );

    // CURSOR
    const cursorPositionComponent: PositionComponent = {
        key: "position",
        position: { x: 0, y: 0 },
        rotation: 0
    }
    const cursorScreenPointComponent: ScreenPointComponent = {
        key: "screenPoint",
        point: { x: 0, y: 0 }
    };
    CANVAS_ELEMENT.addEventListener("mousemove", (event) => {
        cursorScreenPointComponent.point = { x: event.offsetX, y: event.offsetY };
    });

    let cursor = engine.createEntity(
        cursorScreenPointComponent,
        cursorPositionComponent,
        {
            key: 'cursorTranslate',
            get cursorTranslate() {
                return VIEWPORT_POSITION.position;
            }
        } as CursorTranslateComponent);

    let world = engine.createEntity(worldComponent, backgroundGridComponent);

    window.addEventListener("keydown", (event) => {
        KEY_STATES[event.key] = true;
        activateHotkeyBindings();
    });

    window.addEventListener("keyup", (event) => {
        KEY_STATES[event.key] = false;
    });

    window.addEventListener("mousedown", (event: MouseEvent) => {
        MOUSE_KEY_STATES[event.button] = true;
        console.log(event.button);
    });

    CANVAS_ELEMENT.addEventListener("mouseup", (event: MouseEvent) => {
        MOUSE_KEY_STATES[event.button] = false;
    });

    engine.animate();
}

init();