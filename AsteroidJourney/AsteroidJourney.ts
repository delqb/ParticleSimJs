import { Vec2, Vector2, EntityID, Entity, SystemPhase } from "../engine/FluidECS.js";
import { FluidEngine } from "../engine/FluidEngine.js";
import * as Systems from "./system/SystemIndex.js";
import * as Component from "./Components.js";

export var engine = new FluidEngine();

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

export function createParticle(worldComponent: Component.WorldComponent, particleComponent: Component.ParticleComponent, positionComponent: Component.PositionComponent, velocityComponent: Component.VelocityComponent, accelerationComponent: Component.AccelerationComponent, projectileScale: number = 0.0003, optionalComponents?: { movementControlComponent?: Component.MovementControlComponent, targetPositionComponent?: Component.TargetPositionComponent }): Entity {
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
            muzzleSpeed: 2.99792458,
            projectileScale: projectileScale
        } as Component.ProjectileSourceComponent
    );
    if (optionalComponents) {
        for (let component of Object.values(optionalComponents))
            if (component)
                entity.addComponent(component);
    }
    return entity;
}

export function spawnProjectile(worldComponent: Component.WorldComponent, position: Vec2, rotation: number, velocity: Vec2, deathTime: number, generation: number, scale: number = 0.001): Entity {
    return engine.createEntity(
        worldComponent,
        {
            key: 'position',
            position: position,
            rotation: rotation
        } as Component.PositionComponent,
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
            key: "spriteTexture",
            texture: laserShotTexture,
            zIndex: 0
        } as Component.SpriteComponent,
        {
            key: "scale",
            scale: { x: scale, y: scale }
        } as Component.ScaleComponent,
        {
            key: 'acceleration',
            acceleration: { x: 0, y: 0 },
            angular: 0
        } as Component.AccelerationComponent);

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

let kinematicSystem = new Systems.KinematicSystem(),
    positionSystem = new Systems.PositionSystem(),
    collisionSystem = new Systems.CollisionSystem(),
    movementControlSystem = new Systems.MovementControlSystem(),
    viewportSystem = new Systems.ViewportSystem(),
    projectileSystem = new Systems.ProjectileSystem(),
    particleStatSystem = new Systems.ParticleStatSystem(),
    firingSystem = new Systems.FiringSystem(),
    cursorSystem = new Systems.CursorSystem(),
    worldRenderSystem = new Systems.WorldRenderSystem(),
    projectileRenderSystem = new Systems.ProjectileRenderSystem(),
    particleRenderSystem = new Systems.ParticleRenderSystem(),
    viewportRenderSystem = new Systems.ViewportRenderSystem(),
    statRenderSystem = new Systems.StatRenderSystem(),
engine.appendSystems(simulationPhase,
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
    spriteRenderSystem,
    projectileRenderSystem,
    particleRenderSystem
);

engine.appendSystems(hudRender,
    viewportRenderSystem,
    statRenderSystem
);

let VIEWPORT_POSITION: Component.PositionComponent;
let FIRE_CONTROL: Component.FireControlComponent;

// WORLD
let worldComponent: Component.WorldComponent = {
    key: "world",
    resolution: {
        x: 4.096,
        y: 4.096
    },
    borderWidth: 0.1,
    backgroundColor: "#23262B",
}
let backgroundGridComponent: Component.BackgroundGridComponent = {
    key: "backgroundGrid",
    gridSize: 0.064,
    gridLineColor: "#424852",
    gridLineWidth: 0.001
}


let particle1PositionComponent: Component.PositionComponent = {
    key: "position",
    position: Vector2.scale(worldComponent.resolution, 1 / 2),
    rotation: 0
};


// Create red and blue particle
(() => {
    let particleComponent1: Component.ParticleComponent = {
        key: "particle",
        radius: PARTICLE_PARAMETERS.radius,
        color: "red"
    }
    let velocityComponent1: Component.VelocityComponent = {
        key: "velocity",
        velocity: { x: 0, y: 0 },
        angular: 0
    }
    let accelerationComponent1: Component.AccelerationComponent = {
        key: "acceleration",
        acceleration: { x: 0, y: 0 },
        angular: 0
    }
    let FIRE_CONTROL = {
        key: 'fireControl',
        fireIntent: false
    } as Component.FireControlComponent;

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
        0.0003,
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
        } as Component.ParticleStatsComponent,
        FIRE_CONTROL
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
    let particleComponent2: Component.ParticleComponent = {
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
        0.0003,
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
        x: (worldComponent.resolution.x - canvasWidth) / (2 * engine.PIXELS_PER_METER),
        y: (worldComponent.resolution.y - canvasHeight) / (2 * engine.PIXELS_PER_METER),
    }
} as Component.PositionComponent

let viewport = engine.createEntity(
    VIEWPORT_POSITION,
    {
        key: "resolution",
        resolution: {
            x: canvasWidth,
            y: canvasHeight
        }
    } as Component.ResolutionComponent,
    {
        key: "targetPosition",
        targetPosition: particle1PositionComponent.position
    } as Component.TargetPositionComponent,
    {
        key: "borderWidth",
        borderWidth: 0.05 * Math.min(canvasWidth, canvasHeight)
    } as Component.ViewportBorderWidthComponent,
    {
        key: "speedFactor",
        speedFactor: 22
    } as Component.CameraSpeedFactorComponent,
    worldComponent
);

// CURSOR
const cursorPositionComponent: Component.PositionComponent = {
    key: "position",
    position: { x: 0, y: 0 },
    rotation: 0
}
const cursorScreenPointComponent: Component.ScreenPointComponent = {
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
    } as Component.CursorTranslateComponent);

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

engine.createEntity(
    {
        key: "position",
        position: Vector2.copy(particle1PositionComponent.position),
        rotation: Math.PI / 3
    } as Component.PositionComponent,
    {
        key: "spriteTexture",
        texture: starImage,
        zIndex: 1
    } as Component.SpriteComponent,
    {
        key: "scale",
        scale: { x: 0.001, y: 0.001 }
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

engine.animate();