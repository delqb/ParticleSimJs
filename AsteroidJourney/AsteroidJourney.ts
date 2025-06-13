import { Entity, EntityID, SystemPhase } from "@fluidengine/core";
import { FluidEngine } from "@fluidengine/FluidEngine";
import { Vec2, Vector2 } from "@fluidengine/lib/spatial";
import { ImageUtils } from "@fluidengine/lib/utils";
import { canvasToImage } from "@fluidengine/lib/utils/ImageUtils";
import { ClientContext } from "./Client";
import { VelocityComponent, ProjectileComponent, AccelerationComponent, createBoundingBox, MovementControlComponent, FireControlComponent, PositionComponent, StatsComponent, ProjectileSourceComponent, RenderCenterComponent, SpriteComponent, ResolutionComponent, TargetPositionComponent, ViewportBorderWidthComponent, CameraSpeedFactorComponent, ScreenPointComponent } from "./components";
import { KinematicSystem, PositionSystem, MovementControlSystem, ViewportSystem, ProjectileSystem, FiringSystem, CursorSystem, ChunkLoadingSystem, ChunkTrackingSystem, BoundingBoxUpdateSystem, WorldPreRenderSystem, ViewportRenderSystem, StatRenderSystem, SpriteRenderSystem, BoundingBoxRenderSystem, AxisRenderSystem } from "./systems";
import { WorldContext, Chunk } from "./world/World";

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

function renderSingleNeonLaserSprite({
    width = 256,
    height = 128,
    laserLength = 64,
    laserWidth = 16,
    color = "cyan"
} = {}) {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");

    const centerX = width / 2;
    const centerY = height / 2;

    // Fill background with transparency for sprite use
    ctx.clearRect(0, 0, width, height);

    ctx.save();
    ctx.translate(centerX, centerY);

    // Create glowing linear gradient for the laser core
    const gradient = ctx.createLinearGradient(-laserLength / 2, 0, laserLength / 2, 0);
    gradient.addColorStop(0, "transparent");
    gradient.addColorStop(0.3, color);
    gradient.addColorStop(0.7, color);
    gradient.addColorStop(1, "transparent");

    ctx.shadowBlur = 24;
    ctx.shadowColor = color;

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.ellipse(0, 0, laserLength / 2, laserWidth / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    return canvas;
}

function loadImage(assetPath: string) {
    return ImageUtils.loadImage(`${assetRoot}/${assetPath}`);
}

const laserShotCanvas = renderSingleNeonLaserSprite();
const laserShotTexture = canvasToImage(laserShotCanvas);

export const assetRoot = "/AsteroidJourney/assets";

export const backgroundTileImage = await loadImage("background/space_background_tile.png");
export const asteroidImage = await loadImage("asteroid/asteroid1.png");
export const shipImage = await loadImage("ship/ship1.png");
const starImage = canvasToImage(createGlowingStar(3, 3, 5, 40));


export var engine = new FluidEngine(1024);
function setZoomScale(scale: number) {
    engine.PIXELS_PER_METER = 1000 * scale;
}
setZoomScale(0.6);

var CANVAS_ELEMENT = document.getElementById("canvas")! as HTMLCanvasElement;
export var renderContext = CANVAS_ELEMENT.getContext("2d")!;
let canvasWidth = CANVAS_ELEMENT.width,
    canvasHeight = CANVAS_ELEMENT.height;

CANVAS_ELEMENT.addEventListener("contextmenu", function (e) {
    e.preventDefault();
});

resizeCanvas();

const RENDER_BASE_COLOR = "black";

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
        size / laserShotTexture.width
    );
    engine.addEntityComponents(e,
        {
            key: "velocity",
            velocity: velocity,
            angular: 0
        } as VelocityComponent,
        {
            key: "projectile",
            deathTime: deathTime,
            generation: generation
        } as ProjectileComponent,
        {
            key: "acceleration",
            acceleration: { x: 0, y: 0 },
            angular: 0
        } as AccelerationComponent,
        createBoundingBox(
            {
                width: size,
                height: size
            },
            { transform: { scale: 0.10 } }
        )
    );


    return e;
}

export function destroyProjectile(entityID: EntityID) {
    engine.removeEntity(entityID);
}

const KEY_STATES = {
};

const MOVEMENT_CONTROL_COMPONENT: MovementControlComponent = {
    key: "movementControl",
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
            MOVEMENT_CONTROL_COMPONENT.accelerationInput.y += 1;
        }
    },
    down: {
        keys: ["s"],
        action: () => {
            MOVEMENT_CONTROL_COMPONENT.accelerationInput.y += -1;
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
        keys: ["escape"],
        action: () => {
            engine.toggleAnimation();
        }
    },
    zoom1: {
        keys: ["1"],
        action: () => setZoomScale(0.6)
    },
    zoom2: {
        keys: ["2"],
        action: () => setZoomScale(0.1)
    },
    toggle_debug_info: {
        keys: ["f1"],
        action: () => {
            clientContext.displayDebugInfo = !clientContext.displayDebugInfo;
        }
    },
    toggle_colliders: {
        keys: ["f2"],
        action: () => {
            clientContext.displayBoundingBoxes = !clientContext.displayBoundingBoxes;
        }
    },
    toggle_display_axes: {
        keys: ["f3"],
        action: () => {
            clientContext.displayEntityAxes = !clientContext.displayEntityAxes;
        }
    }
}

function activateHotkeyBindings() {
    for (const binding of Object.values(HOTKEYS)) {
        if (binding.keys.some(k => KEY_STATES[k.toLowerCase()] === true))
            binding.action();
    }
}

function resizeCanvas() {
    canvasWidth = CANVAS_ELEMENT.width = window.innerWidth * .98;
    canvasHeight = CANVAS_ELEMENT.height = window.innerHeight * .98;
}

window.addEventListener("resize", resizeCanvas);

export function clearCanvas() {
    renderContext.fillStyle = RENDER_BASE_COLOR;
    renderContext.fillRect(0, 0, canvasWidth, canvasHeight);
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
    renderContext.save();

    renderContext.globalAlpha = 0.5;
    renderContext.fillStyle = RENDER_BASE_COLOR;
    renderContext.fillRect(0, 0, canvasWidth, canvasHeight);
    renderContext.globalAlpha = 0.5;
    renderContext.font = "bold 256px calibri"
    renderContext.fillStyle = "white";
    renderContext.fillText("⏸", (canvasWidth - 256) / 2, canvasHeight / 2);

    renderContext.restore();
}

let simulationPhase = {
    key: "simulation",
    order: 0,
    preUpdate() {
        activateControlBindings();
    },
    postUpdate() {
        MOVEMENT_CONTROL_COMPONENT.yawInput = 0;
        MOVEMENT_CONTROL_COMPONENT.accelerationInput.x = 0;
        MOVEMENT_CONTROL_COMPONENT.accelerationInput.y = 0;
    }
} as SystemPhase


let worldRender = {
    key: "worldrender",
    order: 1,
    postUpdate() {
        renderContext.restore();
    }
} as SystemPhase

let hudRender = {
    key: "hudrender",
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
        this.chunkSize / backgroundTileImage.width
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
const clientContext: ClientContext = new ClientContext(engine, worldContext, renderContext);

let kinematicSystem = new KinematicSystem(clientContext),
    positionSystem = new PositionSystem(engine),
    movementControlSystem = new MovementControlSystem(),
    viewportSystem = new ViewportSystem(clientContext),
    projectileSystem = new ProjectileSystem(),
    firingSystem = new FiringSystem(),
    cursorSystem = new CursorSystem(engine),
    chunkLoadingSystem = new ChunkLoadingSystem(engine, worldContext),
    chunkTrackingSystem = new ChunkTrackingSystem(engine, worldContext),
    boundingBoxUpdateSystem = new BoundingBoxUpdateSystem(),

    worldPreRenderSystem = new WorldPreRenderSystem(clientContext),
    viewportRenderSystem = new ViewportRenderSystem(renderContext),
    statRenderSystem = new StatRenderSystem(clientContext),
    spriteRenderSystem = new SpriteRenderSystem(renderContext),
    colliderRenderSystem = new BoundingBoxRenderSystem(clientContext),
    axisRenderSystem = new AxisRenderSystem(clientContext)
    ;
;

engine.appendSystems(simulationPhase,
    chunkLoadingSystem,
    chunkTrackingSystem,
    cursorSystem,
    firingSystem,
    projectileSystem,
    movementControlSystem,
    kinematicSystem,
    positionSystem,
    viewportSystem,
    boundingBoxUpdateSystem
);

engine.appendSystems(worldRender,
    worldPreRenderSystem,
    spriteRenderSystem,
    colliderRenderSystem,
    axisRenderSystem
);

engine.appendSystems(hudRender,
    viewportRenderSystem,
    statRenderSystem
);

const FIRE_CONTROL = {
    key: "fireControl",
    fireIntent: false
} as FireControlComponent;

export const MC_POS: PositionComponent = {
    key: "position",
    position: { x: 0, y: 0 },
    rotation: -Math.PI / 2
} as PositionComponent;

const MC_SCALE = 0.2 / shipImage.height;
const MAIN_CHARACTER = engine.createNewEntityFromComponents(
    MC_POS,
    {
        key: "velocity",
        velocity: { x: 0, y: 0 },
        angular: 0
    } as VelocityComponent,
    {
        key: "acceleration",
        acceleration: { x: 0, y: 0 },
        angular: 0
    } as AccelerationComponent,
    {
        key: "stats",
        computedAcceleration: 0,
        computedSpeed: 0
    } as StatsComponent,
    {
        key: "projectileSource",
        lastFireTime: 0,
        muzzleSpeed: 2.99792458,
        projectileSize: 0.180
    } as ProjectileSourceComponent,
    {
        key: "renderCenter",
        renderDistance: renderDistance
    } as RenderCenterComponent,
    {
        key: "spriteTexture",
        image: shipImage,
        zIndex: 5,
        transform: {
            scale: MC_SCALE,
            rotate: Math.PI / 2
        }
    } as SpriteComponent,
    createBoundingBox(
        {
            width: MC_SCALE * shipImage.width,
            height: MC_SCALE * shipImage.height
        },
        {
            transform: {
                rotate: Math.PI / 2
            }
        }
    ),
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
    } as PositionComponent,
    {
        key: "resolution",
        resolution: {
            x: canvasWidth,
            y: canvasHeight
        }
    } as ResolutionComponent,
    {
        key: "targetPosition",
        position: MC_POS
    } as TargetPositionComponent,
    {
        key: "borderWidth",
        borderWidth: 0.05 * Math.min(canvasWidth, canvasHeight)
    } as ViewportBorderWidthComponent,
    {
        key: "speedFactor",
        speedFactor: 22
    } as CameraSpeedFactorComponent,
    {
        key: "viewport"
    }
);

const cursorScreenPointComponent: ScreenPointComponent = {
    key: "screenPoint",
    point: { x: 0, y: 0 }
};

CANVAS_ELEMENT.addEventListener("mousemove", (event) => {
    cursorScreenPointComponent.point = { x: event.offsetX, y: event.offsetY };
});

window.addEventListener("keydown", (event) => {
    event.preventDefault();
    KEY_STATES[event.key.toLowerCase()] = true;
    activateHotkeyBindings();
});

window.addEventListener("keyup", (event) => {
    KEY_STATES[event.key.toLowerCase()] = false;
});

window.addEventListener("mousedown", (event: MouseEvent) => {
    MOUSE_KEY_STATES[event.button] = true;
});

CANVAS_ELEMENT.addEventListener("mouseup", (event: MouseEvent) => {
    MOUSE_KEY_STATES[event.button] = false;
});

let starEntity1 = createSpriteEntity(Vector2.copy(MC_POS.position), Math.PI / 3, starImage, 1, 0.003);
engine.addEntityComponents(starEntity1,
    {
        key: "velocity",
        velocity: ({ x: 0.008, y: 0.01 }),
        angular: 0
    } as VelocityComponent
);



export function createSpriteEntity(position: Vec2, rotation: number, spriteTexture: HTMLImageElement, zIndex: number, scale = 1): Entity {
    return engine.createNewEntityFromComponents(
        {
            key: "position",
            position: position,
            rotation: rotation
        } as PositionComponent,
        {
            key: "spriteTexture",
            image: spriteTexture,
            zIndex: zIndex,
            transform: {
                scale: scale,
            }
        } as SpriteComponent
    );
}

export function boundedRandom(min: number, max: number): number {
    return min + (max - min) * Math.random();
}

export function createAsteroid(position: Vec2, rotation: number, velocity: Vec2, angularVelocity: number, size: number): Entity {
    let entity = createSpriteEntity(Vector2.copy(position), rotation, asteroidImage, 3, size / asteroidImage.width);
    engine.addEntityComponents(entity,
        {
            key: "velocity",
            velocity: velocity,
            angular: angularVelocity
        } as VelocityComponent,
        createBoundingBox({ width: size, height: size })
    );
    return entity;
}


engine.animate();