import { Vec2, Vector2, EntityID, Entity, SystemPhase } from "../engine/FluidECS.js";
import { FluidEngine } from "../engine/FluidEngine.js";
import * as Systems from "./system/SystemIndex.js";
import * as Component from "./Components.js";
import { Chunk, WorldContext } from "./world/World.js";

const zoomLevel = 0.6;
export var engine = new FluidEngine(1000 * zoomLevel);

var CANVAS_ELEMENT = document.getElementById("canvas")! as HTMLCanvasElement;
export var CONTEXT = CANVAS_ELEMENT.getContext("2d")!;
let canvasWidth = CANVAS_ELEMENT.width,
    canvasHeight = CANVAS_ELEMENT.height;

CANVAS_ELEMENT.addEventListener('contextmenu', function (e) {
    e.preventDefault();
});

resizeCanvas();

const RENDER_BASE_COLOR = "black";

const FPS_CALCULATION_INTERVAL = 20;
let lastFrameTime = 0;
let fpsFrameCounter = 0;
export let measuredFPS = 0;

export const PARTICLE_PARAMETERS = {
    radius: 0.01,
    projectile: {
        radius: 0.0045,
        lifetime: 5, //in seconds
        fireRate: 10 //in shots per second
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

export function spawnProjectile(position: Vec2, rotation: number, velocity: Vec2, deathTime: number, generation: number, size: number = 0.001): Entity {
    let e = createSpriteEntity(
        position,
        rotation,
        laserShotTexture,
        0,
        { resolution: { x: size, y: size } }
    );
    engine.addEntityComponents(e,
        {
            key: 'velocity',
            velocity: velocity,
            angular: 0
        } as Component.VelocityComponent,
        {
            key: 'projectile',
            deathTime: deathTime,
            generation: generation
        } as Component.ProjectileComponent,
        {
            key: 'acceleration',
            acceleration: { x: 0, y: 0 },
            angular: 0
        } as Component.AccelerationComponent
);

return e;
}

export function destroyProjectile(entityID: EntityID) {
    engine.removeEntity(entityID);
}

const KEY_STATES = {
};

const MOVEMENT_CONTROL_COMPONENT: Component.MovementControlComponent = {
    key: 'movementControl',
    accelerationInput: {
        x: 0,
        y: 0
    },
    yawInput: 0
}

const KEYBOARD_CONTROLS = {
    up: {
        type: "movement",
        keys: ["w"],
        action: () => {
            MOVEMENT_CONTROL_COMPONENT.accelerationInput.y += -1;
        }
    },
    down: {
        keys: ["s"],
        action: () => {
            MOVEMENT_CONTROL_COMPONENT.accelerationInput.y += 1;
        }
    },
    left: {
        keys: ["a"],
        action: () => {
            MOVEMENT_CONTROL_COMPONENT.accelerationInput.x += -1;
        }
    },
    right: {
        keys: ["d"],
        action: () => {
            MOVEMENT_CONTROL_COMPONENT.accelerationInput.x += 1;
        }
    },
    yawLeft: {
        keys: ["q"],
        action: () => {
            MOVEMENT_CONTROL_COMPONENT.yawInput -= 1;
        }
    },
    yawRight: {
        keys: ["e"],
        action: () => {
            MOVEMENT_CONTROL_COMPONENT.yawInput += 1;
        }
    }
};

const MOUSE_KEY_STATES = {

}

const MOUSE_CONTROLS = {
}

const HOTKEYS = {
    pause: {
        keys: ["Escape"],
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

export function clearCanvas() {
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
        measuredFPS = Math.round(100 * FPS_CALCULATION_INTERVAL * 1000 / (now - lastFrameTime)) / 100;

    lastFrameTime = now;
}

function updateStats() {
    updateFPS();
}

function activateControlBindings() {
    for (const controlBinding of Object.keys(KEYBOARD_CONTROLS).map(k => KEYBOARD_CONTROLS[k])) {
        if (controlBinding.keys.some(k => KEY_STATES[k]))
            controlBinding.action();
    }
    for (const controlBinding of Object.keys(MOUSE_CONTROLS).map(k => MOUSE_CONTROLS[k])) {
        if (controlBinding.keys.some(k => MOUSE_KEY_STATES[k]))
            controlBinding.action();
    }
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

let simulationPhase = {
    key: 'simulation',
    order: 0,
    preUpdate() {
        activateControlBindings();
        updateStats();
    },
    postUpdate() {
        MOVEMENT_CONTROL_COMPONENT.yawInput = 0;
        MOVEMENT_CONTROL_COMPONENT.accelerationInput.x = 0;
        MOVEMENT_CONTROL_COMPONENT.accelerationInput.y = 0;
    }
} as SystemPhase

let scaledCanvasRes = Vector2.scale({ x: canvasWidth, y: canvasHeight }, 1 / engine.PIXELS_PER_METER);
let scaledCanvasCenter = Vector2.scale(scaledCanvasRes, 1 / 2);
let worldRender = {
    key: 'worldrender',
    order: 1,
    preUpdate() {
        clearCanvas();
        CONTEXT.save();
        CONTEXT.scale(engine.PIXELS_PER_METER, engine.PIXELS_PER_METER);
        //Move canvas origin to center of screen (camera pivot point)
        CONTEXT.translate(scaledCanvasCenter.x, scaledCanvasCenter.y);
        //Rotate in the opposite direction of the player
        CONTEXT.rotate(-particle1PositionComponent.rotation - Math.PI / 2);
        let vpCenterPos = Vector2.add(VIEWPORT_POSITION.position, scaledCanvasCenter);
        //Move world so that player is at the center of the screen
        CONTEXT.translate(-vpCenterPos.x, -vpCenterPos.y);
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

engine.addPhase(simulationPhase, worldRender, hudRender);

let renderDistance: number = 3;
function generateChunk(worldContext: WorldContext, chunkCoordinates: Vec2): Chunk {
    // Creates background
    let backgroundEntity = createSpriteEntity(
        Vector2.scale(chunkCoordinates, this.chunkSize),
        0,
        backgroundTileImage,
        0,
        {
            resolution: { x: this.chunkSize, y: this.chunkSize }
        }
    );

    const gridSize = worldContext.chunkSize / 3,
        asteroidProbability = 0.3;
    const minVelocity = 0.08, maxVelocity = 0.32,
        maxAngularVelocity = 1.2;
    const minSize = 0.06,
        maxSize = 0.20;

    for (let dX = 0; dX < gridSize; dX++)
        for (let dY = 0; dY < gridSize; dY++) {
            if (Math.random() > asteroidProbability)
                continue;

            let cX = chunkCoordinates.x + dX * gridSize;
            let cY = chunkCoordinates.y + dY * gridSize;
            let position = {
                x: boundedRandom(cX, cX + gridSize),
                y: boundedRandom(cY, cY + gridSize)
            }
            let rotation = Math.random() * 2 * Math.PI;
            let velocity = Vector2.scale(
                Vector2.normalize(
                    {
                        x: Math.random() - 0.5,
                        y: Math.random() - 0.5
                    }),
                boundedRandom(minVelocity, maxVelocity)
            );
            let angularVelocity = boundedRandom(minVelocity, maxAngularVelocity);
            let scale = boundedRandom(minSize, maxSize);
            createAsteroid(position, rotation, velocity, angularVelocity, scale);
        }

    return {
        lastAccessed: this.engineInstance.getGameTime(),
        state: "loaded",
        coordinates: chunkCoordinates,
        entityIDSet: new Set([backgroundEntity.getID()])
    }
}
const worldContext: WorldContext = new WorldContext(engine, 1.024, 0.1, generateChunk);

let kinematicSystem = new Systems.KinematicSystem(),
    positionSystem = new Systems.PositionSystem(),
    movementControlSystem = new Systems.MovementControlSystem(),
    viewportSystem = new Systems.ViewportSystem(),
    projectileSystem = new Systems.ProjectileSystem(),
    statSystem = new Systems.StatSystem(),
    firingSystem = new Systems.FiringSystem(),
    cursorSystem = new Systems.CursorSystem(),

    // worldRenderSystem = new Systems.WorldRenderSystem(),
    projectileRenderSystem = new Systems.ProjectileRenderSystem(),
    particleRenderSystem = new Systems.ParticleRenderSystem(),
    viewportRenderSystem = new Systems.ViewportRenderSystem(),
    statRenderSystem = new Systems.StatRenderSystem(),
    spriteRenderSystem = new Systems.SpriteRenderSystem(CONTEXT),
    chunkLoadingSystem = new Systems.ChunkLoadingSystem(engine, worldContext),
    ChunkTrackingSystem = new Systems.ChunkTrackingSystem(engine, worldContext)
    ;

engine.appendSystems(simulationPhase,
    chunkLoadingSystem,
    ChunkTrackingSystem,
    cursorSystem,
    firingSystem,
    projectileSystem,
    movementControlSystem,
    kinematicSystem,
    positionSystem,
    statSystem,
    viewportSystem
);

engine.appendSystems(worldRender,
    // worldRenderSystem,
    spriteRenderSystem,
    projectileRenderSystem,
    particleRenderSystem
);

engine.appendSystems(hudRender,
    viewportRenderSystem,
    statRenderSystem
);



const FIRE_CONTROL = {
    key: 'fireControl',
    fireIntent: false
} as Component.FireControlComponent;

const MC_POS: Component.PositionComponent = {
    key: "position",
    position: { x: 0, y: 0 },
    rotation: 0
} as Component.PositionComponent;

const MAIN_CHARACTER = engine.createNewEntityFromComponents(
    MC_POS,
    {
        key: "velocity",
        velocity: { x: 0, y: 0 },
        angular: 0
    } as Component.VelocityComponent,
    {
        key: "acceleration",
        acceleration: { x: 0, y: 0 },
        angular: 0
    } as Component.AccelerationComponent,
    {
        key: "particle",
        radius: PARTICLE_PARAMETERS.radius,
        color: "red"
    } as Component.ParticleComponent,
    {
        key: 'stats',
        computedAcceleration: 0,
        computedSpeed: 0
    } as Component.StatsComponent,
        {
        key: "projectileSource",
        lastFireTime: 0,
        muzzleSpeed: 2.99792458,
        projectileSize: 0.075
    } as Component.ProjectileSourceComponent,
        {
            key: "renderCenter",
            renderDistance: renderDistance
    } as Component.RenderCenterComponent,
    MOVEMENT_CONTROL_COMPONENT,
    FIRE_CONTROL,
    );

    MOUSE_CONTROLS["fire"] = {
        keys: [0],
        action: () => {
            FIRE_CONTROL.fireIntent = true;
        },
    };

    KEYBOARD_CONTROLS["fire"] = {
        keys: [" "],
        action: () => {
            FIRE_CONTROL.fireIntent = true;
        }
    };

let viewport = engine.createNewEntityFromComponents(
        {
            key: "position",
        position: {
            x: 0,
            y: 0,
        },
        rotation: 0
    } as Component.PositionComponent,
    {
        key: "resolution",
        resolution: {
            x: canvasWidth,
            y: canvasHeight
        }
    } as Component.ResolutionComponent,
    {
        key: "targetPosition",
        targetPositionComponent: MC_POS
    } as Component.TargetPositionComponent,
    {
        key: "borderWidth",
        borderWidth: 0.05 * Math.min(canvasWidth, canvasHeight)
    } as Component.ViewportBorderWidthComponent,
    {
        key: "speedFactor",
        speedFactor: 22
    } as Component.CameraSpeedFactorComponent,
    {
        key: 'viewport'
    }
);

const cursorScreenPointComponent: Component.ScreenPointComponent = {
    key: "screenPoint",
    point: { x: 0, y: 0 }
};

CANVAS_ELEMENT.addEventListener("mousemove", (event) => {
    cursorScreenPointComponent.point = { x: event.offsetX, y: event.offsetY };
});

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

function createGlowingStar(spikes, outerRadius, innerRadius, glowRadius) {
    const size = glowRadius * 2;
    const offCanvas = document.createElement("canvas");
    offCanvas.width = offCanvas.height = size;
    const offCtx = offCanvas.getContext("2d");
    const cx = size / 2;
    const cy = size / 2;

    // Glow
    const glow = offCtx.createRadialGradient(cx, cy, innerRadius, cx, cy, glowRadius);
    glow.addColorStop(0, "rgba(255, 255, 150, 0.5)");
    glow.addColorStop(1, "rgba(255, 255, 150, 0)");

    offCtx.fillStyle = glow;
    offCtx.beginPath();
    offCtx.arc(cx, cy, glowRadius, 0, 2 * Math.PI);
    offCtx.fill();

    // Star path
    offCtx.beginPath();
    const step = Math.PI / spikes;
    let rotation = Math.PI / 2 * 3;

    offCtx.moveTo(cx, cy - outerRadius);
    for (let i = 0; i < spikes; i++) {
        let x = cx + Math.cos(rotation) * outerRadius;
        let y = cy + Math.sin(rotation) * outerRadius;
        offCtx.lineTo(x, y);
        rotation += step;

        x = cx + Math.cos(rotation) * innerRadius;
        y = cy + Math.sin(rotation) * innerRadius;
        offCtx.lineTo(x, y);
        rotation += step;
    }
    offCtx.closePath();

    offCtx.fillStyle = "#FFD700";
    offCtx.fill();
    offCtx.strokeStyle = "#FFF";
    offCtx.lineWidth = 1.2;
    offCtx.stroke();

    return offCanvas;
}

function canvasToImage(canvas: HTMLCanvasElement) {
    const imageDataUrl = canvas.toDataURL();
    const image = new Image();
    image.src = imageDataUrl;
    return image;
}

const starImage = canvasToImage(createGlowingStar(3, 3, 5, 40));

let starEntity1 = engine.createNewEntityFromComponents(
    {
        key: "position",
        position: Vector2.copy(MC_POS.position),
        rotation: Math.PI / 3
    } as Component.PositionComponent,
    {
        key: "spriteTexture",
        texture: starImage,
        zIndex: 1
    } as Component.SpriteComponent,
    {
        key: "scale",
        scale: { x: 0.0005, y: 0.002 }
    } as Component.ScaleComponent,
    {
        key: "velocity",
        velocity: ({ x: 0.008, y: 0.01 }),
        angular: 0
    } as Component.VelocityComponent
);


function renderSingleNeonLaserSprite({
    width = 256,
    height = 128,
    laserLength = 64,
    laserWidth = 16,
    color = 'cyan'
} = {}) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    const centerX = width / 2;
    const centerY = height / 2;

    // Fill background with transparency for sprite use
    ctx.clearRect(0, 0, width, height);

    ctx.save();
    ctx.translate(centerX, centerY);

    // Create glowing linear gradient for the laser core
    const gradient = ctx.createLinearGradient(-laserLength / 2, 0, laserLength / 2, 0);
    gradient.addColorStop(0, 'transparent');
    gradient.addColorStop(0.3, color);
    gradient.addColorStop(0.7, color);
    gradient.addColorStop(1, 'transparent');

    ctx.shadowBlur = 24;
    ctx.shadowColor = color;

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.ellipse(0, 0, laserLength / 2, laserWidth / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    return canvas;
}

const laserShotCanvas = renderSingleNeonLaserSprite();
const laserShotTexture = canvasToImage(laserShotCanvas);

function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = (err) => reject(err);
        img.src = src;
    });
}

export const backgroundTileImage = await loadImage("assets/background/space_background_tile.png");
export const asteroidImage = await loadImage("assets/asteroid/asteroid1.png");

export function createSpriteEntity(position: Vec2, rotation: number, spriteTexture: HTMLImageElement, zIndex: number, options: { scale?: Vec2, resolution?: Vec2 } = {}): Entity {
    let iRes = { x: spriteTexture.width, y: spriteTexture.height };
    let scale: Vec2;
    if (options.scale)
        scale = options.scale;
    else
        if (options.resolution)
            scale = Vector2.divide(options.resolution, iRes);
        else
            scale = { x: 1, y: 1 };
    return engine.createNewEntityFromComponents(
        {
            key: "position",
            position: position,
            rotation: rotation
        } as Component.PositionComponent,
        {
            key: "scale",
            scale: scale
        } as Component.ScaleComponent,
        {
            key: "spriteTexture",
            texture: spriteTexture,
            zIndex: zIndex
        } as Component.SpriteComponent
    );
}

export function boundedRandom(min: number, max: number): number {
    return min + (max - min) * Math.random();
}

export function createAsteroid(position: Vec2, rotation: number, velocity: Vec2, angularVelocity: number, size: number): Entity {
    let entity = createSpriteEntity(position, rotation, asteroidImage, 3, { resolution: { x: size, y: size } });
    engine.addEntityComponents(entity,
        {
            key: "velocity",
            velocity: velocity,
            angular: angularVelocity
        } as Component.VelocityComponent
    );
    return entity;
}

engine.animate();