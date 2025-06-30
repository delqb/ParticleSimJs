import { ClientContext } from "./client/Client";
import { CanvasRenderer } from "./client/renderer/Renderer";
import { Sprite, SpriteComponent } from "./components/SpriteComponent";
import { RenderCenter, RenderCenterComponent } from "./components/RenderCenterComponent";
import { Stats, StatsComponent } from "./components/StatsComponent";
import { FireControl, FireControlComponent } from "./components/FireControlComponent";
import { MovementControl, MovementControlComponent } from "./components/MovementControlComponent";
import { ViewportBorderWidth, ViewportBorderWidthComponent } from "./components/ViewportBorderWidthComponent";
import { CameraSpeedFactor, CameraSpeedFactorComponent } from "./components/CameraSpeedFactorComponent";
import { ScreenPoint, ScreenPointComponent } from "./components/ScreenPointComponent";
import { Acceleration, AccelerationComponent } from "./components/AccelerationComponent";
import { Velocity, VelocityComponent } from "./components/VelocityComponent";
import { TargetPosition, TargetPositionComponent } from "./components/TargetPositionComponent";
import { Position, PositionComponent } from "./components/PositionComponent";
import { Resolution, ResolutionComponent } from "./components/ResolutionComponent";
import {
    AxisRenderSystem,
    BoundingBoxRenderSystem,
    BoundingBoxUpdateSystem,
    ChunkBorderRenderSystem,
    ChunkLoadingSystem,
    ChunkOccupancyUpdateSystem,
    ChunkUnloadingSystem,
    CollisionDetectionSystem,
    CursorSystem,
    DebugInfoDisplaySystem,
    FiringSystem,
    KinematicSystem,
    MovementControlSystem,
    PositionSystem,
    ProjectileSystem,
    SpriteRenderSystem,
    ViewportRenderSystem,
    ViewportSystem,
    WorldPreRenderSystem
} from "./systems";
import { OccupiedChunkHighlightingSystem } from "./systems/render/debug/OccupiedChunkHighlightingSystem";
import { WorldContext } from "./world/World";
import { canvasToImage, loadImage } from "@fluid/lib/utils/ImageUtils";
import { FluidEngine } from "@fluid/FluidEngine";
import { Vector2, Vec2 } from "@fluid/lib/spatial/Vector2";
import { boundedRandom } from "@fluid/lib/utils/MathUtils";
import { ChunkIndex, ChunkMeta, getChunkCenterFromIndex, createChunk, ChunkState } from "@fluid/lib/world/chunk/Chunk";
import { BoundingBox, createBoundingBox } from "./components/BoundingBoxComponent";
import { Projectile, ProjectileComponent } from "./components/ProjectileComponent";
import { Chunk } from "./components/ChunkComponent";
import { Fluid } from "@fluid/Fluid";
import { ECSEntityId } from "@fluid/core/entity/EntityId";
import { ChunkOccupancy } from "./components/ChunkOccupancyComponent";
import { ProjectileSource } from "./components/ProjectileSourceComponent";
import { Viewport } from "./components/ViewportComponent";
import { FluidSystemPhase } from "@fluid/impl/core/system/FluidSystemPhase";

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

function loadImg(assetPath: string) {
    return loadImage(`${assetRoot}/${assetPath}`);
}

const laserShotCanvas = renderSingleNeonLaserSprite();
const laserShotTexture = canvasToImage(laserShotCanvas);

export const assetRoot = "/AsteroidJourney/assets";
export const backgroundTileImage = await loadImg("background/space_background_tile.png");
export const asteroidImage = await loadImg("asteroid/asteroid1.png");
export const shipImage = await loadImg("ship/ship1.png");
const starImage = canvasToImage(createGlowingStar(3, 3, 5, 40));

function generateChunk(worldContext: WorldContext, chunkIndex: ChunkIndex, chunkSize: number): ChunkMeta {
    const chunkCenter = getChunkCenterFromIndex(chunkIndex[0], chunkIndex[1], chunkSize);
    // Creates background
    let chunkEntity = createSpriteEntity(
        chunkCenter,
        0,
        backgroundTileImage,
        0,
        chunkSize / backgroundTileImage.width
    );

    const halfChunkSize = chunkSize / 2;
    const nSubDivision = 3;
    const subGridSize = chunkSize / 3;
    const asteroidProbability = 0.3,
        sgap = asteroidProbability / (nSubDivision * nSubDivision);
    const minVelocity = 0.08, maxVelocity = 0.32,
        maxAngularVelocity = 1.2;
    const minSize = 0.06,
        maxSize = 0.20;

    for (let i = 0; i < nSubDivision; i++)
        for (let j = 0; j < nSubDivision; j++) {
            if (Math.random() > sgap)
                continue;

            let x = chunkCenter.x - halfChunkSize + i * subGridSize;
            let y = chunkCenter.y - halfChunkSize + j * subGridSize;
            let asteroidPosition = {
                x: boundedRandom(x, x + subGridSize),
                y: boundedRandom(y, y + subGridSize)
            }
            let asteroidRotation = Math.random() * 2 * Math.PI;
            let asteroidVelocity = Vector2.scale(
                Vector2.normalize(
                    {
                        x: Math.random() - 0.5,
                        y: Math.random() - 0.5
                    }),
                boundedRandom(minVelocity, maxVelocity)
            );
            let angularVelocity = boundedRandom(minVelocity, maxAngularVelocity);
            let scale = boundedRandom(minSize, maxSize);
            createAsteroid(asteroidPosition, asteroidRotation, asteroidVelocity, angularVelocity, scale);
        }

    const chunkMeta = createChunk(
        chunkIndex,
        chunkSize,
        ChunkState.Loaded,
        {
            entitySymbolSet: new Set([chunkEntity.getSymbol()]),
            lastAccessed: engine.getGameTime(),
        }
    );

    const chunkComponent = Chunk.createComponent({ chunk: chunkMeta }, false);
    Fluid.addEntityComponent(chunkEntity, chunkComponent);
    return chunkMeta;
}

const canvasElement = document.getElementById("canvas")! as HTMLCanvasElement;
canvasElement.addEventListener("contextmenu", function (e) {
    e.preventDefault();
});
const VIEWPORT_RESOLUTION_COMPONENT = Resolution.createComponent({
    resolution: Vector2.zero()
});

const renderContext = canvasElement.getContext("2d")!;
const renderer = new CanvasRenderer(
    canvasElement,
    {
        scale: 0.98,
        renderBaseColor: "black",
        onresize:
            (pw, ph, nw, nh) => {
                VIEWPORT_RESOLUTION_COMPONENT.data.resolution.x = nw;
                VIEWPORT_RESOLUTION_COMPONENT.data.resolution.y = nh;
            }
    });

let renderDistance: number = 5;
const engine = new FluidEngine(Fluid.core(), 1024);
const worldContext: WorldContext = new WorldContext(engine, 1.024, 0.1, generateChunk);
const clientContext: ClientContext = new ClientContext(engine, worldContext, renderer);

clientContext.setZoomLevel(20);

const KEY_STATES = {
};

const MOVEMENT_CONTROL_COMPONENT = MovementControl.createComponent({
    accelerationInput: {
        x: 0,
        y: 0
    },
    yawInput: 0
});

const KEYBOARD_CONTROLS = {
    up: {
        type: "movement",
        keys: ["w"],
        action: () => {
            MOVEMENT_CONTROL_COMPONENT.data.accelerationInput.y += 1;
        }
    },
    down: {
        keys: ["s"],
        action: () => {
            MOVEMENT_CONTROL_COMPONENT.data.accelerationInput.y += -1;
        }
    },
    left: {
        keys: ["a"],
        action: () => {
            MOVEMENT_CONTROL_COMPONENT.data.accelerationInput.x += -1;
        }
    },
    right: {
        keys: ["d"],
        action: () => {
            MOVEMENT_CONTROL_COMPONENT.data.accelerationInput.x += 1;
        }
    },
    yawLeft: {
        keys: ["q"],
        action: () => {
            MOVEMENT_CONTROL_COMPONENT.data.yawInput -= 1;
        }
    },
    yawRight: {
        keys: ["e"],
        action: () => {
            MOVEMENT_CONTROL_COMPONENT.data.yawInput += 1;
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
    eagle_eye_zoom: {
        keys: ["v"],
        action: () => clientContext.setZoomLevel(5)
    },
    reset_zoom: {
        keys: ["x"],
        action: () => clientContext.setZoomLevel(30)
    },
    decrease_zoom: {
        keys: ["z"],
        action: () => {
            const decrement = 10;
            const max = 100;
            const min = decrement;
            const next = (clientContext.getZoomLevel() - decrement);

            clientContext.setZoomLevel(next < min ? max : next);
        }
    },
    increase_zoom: {
        keys: ["c"],
        action: () => {
            const increment = 10;
            const max = 100;
            const min = increment;
            const next = (clientContext.getZoomLevel() + increment);

            clientContext.setZoomLevel(next > max ? min : next);
        }
    },
    slow_time: {
        keys: ["["],
        action: () => clientContext.setSimulationSpeed(clientContext.getSimulationSpeed() / 2)
    },
    speed_time: {
        keys: ["]"],
        action: () => clientContext.setSimulationSpeed(clientContext.getSimulationSpeed() * 2)
    },
    reset_simulation_speed: {
        keys: ["-"],
        action: () => clientContext.setSimulationSpeed(1)
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
    },
    toggle_display_chunks: {
        keys: ["f4"],
        action: () => {
            clientContext.displayChunks = !clientContext.displayChunks;
        }
    }
}

function activateHotkeyBindings() {
    for (const binding of Object.values(HOTKEYS)) {
        if (binding.keys.some(k => KEY_STATES[k.toLowerCase()] === true))
            binding.action();
    }
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
    renderer.clear();
    renderContext.globalAlpha = 0.5;
    renderContext.font = "bold 256px calibri"
    renderContext.fillStyle = "white";
    renderContext.fillText("⏸", (renderer.getWidth() - 256) / 2, renderer.getHeight() / 2);

    renderContext.restore();
}

const simulationPhase = new FluidSystemPhase(
    "Simulation Phase",
    () => {
        activateControlBindings();
    },
    () => {
        MOVEMENT_CONTROL_COMPONENT.data.yawInput = 0;
        MOVEMENT_CONTROL_COMPONENT.data.accelerationInput.x = 0;
        MOVEMENT_CONTROL_COMPONENT.data.accelerationInput.y = 0;
        FIRE_CONTROL_COMPONENT.data.fireIntent = false;
    }
);

const worldRenderPhase = new FluidSystemPhase(
    "World Render Phase",
    () => { },
    () => {
        renderContext.restore();
    }
);

const hudRenderPhase = new FluidSystemPhase(
    "Hud Render Phase",
    () => { },
    () => {
        if (!engine.getAnimationState())
            drawPauseScreen();
    }
);

const sysman = Fluid.core().getSystemOrchestrator();
sysman.pushPhases(simulationPhase, worldRenderPhase, hudRenderPhase);

let kinematicSystem = new KinematicSystem(clientContext),
    positionSystem = new PositionSystem(engine),
    movementControlSystem = new MovementControlSystem(),
    viewportSystem = new ViewportSystem(clientContext),
    projectileSystem = new ProjectileSystem(engine),
    firingSystem = new FiringSystem(engine, p => spawnProjectile(p.position, p.velocity, p.rotation, p.angularVelocity, p.deathTime, p.generation, p.size)),
    cursorSystem = new CursorSystem(engine),
    chunkLoadingSystem = new ChunkLoadingSystem(engine, worldContext),
    chunkUnloadingSystem = new ChunkUnloadingSystem(engine, worldContext),
    chunkOccupancyUpdateSystem = new ChunkOccupancyUpdateSystem(engine, worldContext),
    boundingBoxUpdateSystem = new BoundingBoxUpdateSystem(),
    collisionDetectionSystem = new CollisionDetectionSystem(engine),

    worldPreRenderSystem = new WorldPreRenderSystem(clientContext),
    viewportRenderSystem = new ViewportRenderSystem(renderContext),
    debugInfoDisplaySystem = new DebugInfoDisplaySystem(clientContext),
    spriteRenderSystem = new SpriteRenderSystem(renderContext),
    boundingBoxRenderSystem = new BoundingBoxRenderSystem(clientContext),
    axisRenderSystem = new AxisRenderSystem(clientContext),
    chunkBorderRenderSystem = new ChunkBorderRenderSystem(clientContext),
    occupiedChunkHighlightingSystem = new OccupiedChunkHighlightingSystem(clientContext)
    ;

simulationPhase.pushSystems(
    chunkLoadingSystem,
    chunkOccupancyUpdateSystem,
    chunkUnloadingSystem,
    cursorSystem,
    firingSystem,
    projectileSystem,
    movementControlSystem,
    kinematicSystem,
    positionSystem,
    viewportSystem,
    boundingBoxUpdateSystem,
    collisionDetectionSystem
);

worldRenderPhase.pushSystems(
    worldPreRenderSystem,
    spriteRenderSystem,
    occupiedChunkHighlightingSystem,
    chunkBorderRenderSystem,
    boundingBoxRenderSystem,
    axisRenderSystem
);

hudRenderPhase.pushSystems(
    viewportRenderSystem,
    debugInfoDisplaySystem
);

const FIRE_CONTROL_COMPONENT = FireControl.createComponent({ fireIntent: false });

const MC_POS = Position.createComponent({
    position: { x: 0, y: 0 },
    rotation: -Math.PI / 2
});

const MC_SCALE = 0.2 / shipImage.height;

function initMainCharacter(): ECSEntityId {
    return Fluid.createEntityWithComponents(
        MC_POS,
        Velocity.createComponent(
            {
                velocity: { x: 0, y: 0 },
                angular: 0
            }),
        Acceleration.createComponent(
            {
                acceleration: { x: 0, y: 0 },
                angular: 0
            }),
        Stats.createComponent({}),
        ProjectileSource.createComponent({
            muzzleSpeed: 1.2 * 2.99792458,
            fireRate: 14,
            projectileLifeTime: 1.5,
            projectileSize: 0.180,
            lastFireTime: 0,
            transform: { scale: shipImage.width * MC_SCALE * 1.5 / 2 }
        }),
        RenderCenter.createComponent({ renderDistance: renderDistance }),
        Sprite.createComponent(
            {
                image: shipImage,
                zIndex: 5,
                transform: {
                    scale: MC_SCALE,
                    rotate: Math.PI / 2
                }
            }),
        BoundingBox.createComponent(
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
            )),
        ChunkOccupancy.createComponent({ chunkKeys: new Set() }),
        MOVEMENT_CONTROL_COMPONENT,
        FIRE_CONTROL_COMPONENT,
    );
}

const MAIN_CHARACTER = initMainCharacter();


MOUSE_CONTROLS["fire"] = {
    keys: [0],
    action: () => {
        FIRE_CONTROL_COMPONENT.data.fireIntent = true;
    },
};

KEYBOARD_CONTROLS["fire"] = {
    keys: [" "],
    action: () => {
        FIRE_CONTROL_COMPONENT.data.fireIntent = true;
    }
};

let viewport = Fluid.createEntityWithComponents(
    Position.createComponent({
        position: {
            x: 0,
            y: 0,
        },
        rotation: 0
    }),
    TargetPosition.createComponent({
        position: MC_POS.data
    }),
    ViewportBorderWidth.createComponent({
        borderWidth: 0.05 * Math.min(renderer.getWidth(), renderer.getHeight())
    }),
    CameraSpeedFactor.createComponent({
        speedFactor: 22
    }),
    Viewport.createComponent({
    }),
    VIEWPORT_RESOLUTION_COMPONENT
);

const CURSOR_SCREEN_COMPONENT = ScreenPoint.createComponent({
    point: { x: 0, y: 0 }
});

canvasElement.addEventListener("mousemove", (event) => {
    CURSOR_SCREEN_COMPONENT.data.point = { x: event.offsetX, y: event.offsetY };
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

canvasElement.addEventListener("mouseup", (event: MouseEvent) => {
    MOUSE_KEY_STATES[event.button] = false;
});

export function createSpriteEntity(position: Vec2, rotation: number, spriteTexture: HTMLImageElement, zIndex: number, scale = 1): ECSEntityId {
    return Fluid.createEntityWithComponents(
        Position.createComponent({
            position,
            rotation
        }),
        Sprite.createComponent({
            image: spriteTexture,
            zIndex,
            transform: {
                scale
            }
        })
    )
}

export function createAsteroid(position: Vec2, rotation: number, velocity: Vec2, angularVelocity: number, size: number): ECSEntityId {
    const entity = createSpriteEntity(Vector2.copy(position), rotation, asteroidImage, 3, size / asteroidImage.width);
    Fluid.addEntityComponents(entity,
        Velocity.createComponent({
            velocity,
            angular: angularVelocity
        }),
        ChunkOccupancy.createComponent({ chunkKeys: new Set() }),
        BoundingBox.createComponent(createBoundingBox({ width: size, height: size })),
    );
    return entity;
}

export function spawnProjectile(position: Vec2, velocity: Vec2, rotation: number, angularVelocity: number, deathTime: number, generation: number, size: number = 0.001): ECSEntityId {
    const entity = createSpriteEntity(
        position,
        rotation,
        laserShotTexture,
        0,
        size / laserShotTexture.width
    );
    Fluid.addEntityComponents(entity,
        Velocity.createComponent({
            velocity: velocity,
            angular: angularVelocity
        }),
        Projectile.createComponent({
            deathTime: deathTime,
            generation: generation
        }),
        Acceleration.createComponent({
            acceleration: { x: 0, y: 0 },
            angular: 0
        }),
        BoundingBox.createComponent(
            createBoundingBox(
                {
                    width: size,
                    height: size
                },
                { transform: { scale: 0.10 } }
            )
        ),
        ChunkOccupancy.createComponent({ chunkKeys: new Set() })
    );
    return entity;
}

engine.animate();
console.log("Asteroid Journey Started!");