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


type Component = {
    key: string;
};

type Node = {
    [key: string]: Component
};


class Entity {
    private id: EntityID = createUID();
    private components = new Map<string, Component>();

    getID(): EntityID {
        return this.id;
    }

    hasComponents(keys: string[]): boolean {
        return keys.every(key => this.components.has(key));
    }

    getComponent<T extends Component>(key: string): T | undefined {
        return this.components.get(key) as T;
    }

    addComponent<T extends Component>(component: T): void {
        this.components.set(component.key, component);
    }

    removeComponent(key: string): boolean {
        return this.components.delete(key);
    }

    getComponentMap(): Map<string, Component> {
        return this.components;
    }
}

abstract class System<T extends Node> {
    abstract readonly NODE_COMPONENT_KEYS: Set<Extract<keyof T, string>>;
    private nodeMap: Map<EntityID, T> = new Map();

    public createNode(entity: Entity): T | null {
        const node: Node = {};
        for (const key of this.NODE_COMPONENT_KEYS) {
            if (!entity.getComponentMap().has(key))
                return null;
            node[key] = entity.getComponent(key)!;
        }
        if (node)
            this.addNode(entity.getID(), node as T);
        return node as T;
    }

    public validateEntity(entity: Entity): boolean {
        if (entity.hasComponents(Array.from(this.NODE_COMPONENT_KEYS)))
            return true;
        this.removeNode(entity.getID());
        return false;
    }
    public hasNode(entityID: EntityID): boolean {
        return this.nodeMap.has(entityID);
    }
    public getNode(entityID: EntityID): Node | undefined {
        return this.nodeMap.get(entityID);
    }
    public addNode(entityID: EntityID, node: T) {
        this.nodeMap.set(entityID, node);
    }
    public removeNode(entityID: EntityID): boolean {
        return this.nodeMap.delete(entityID);
    }
    public getNodeMap(): Map<EntityID, T> {
        return this.nodeMap;
    }
    public update(): void {
        this.nodeMap.forEach(this.updateNode);
    }
    public abstract updateNode(node: T, entityID: EntityID): void;
}

/* 

Later: System management
Prioritized list
plus phases: (preupdate, update, postupdate, prerender, render (world is rendered here), postrender (hud is rendered here))
*/

class Engine {
    private entityMap: Map<EntityID, Entity> = new Map();
    private systemList: System<any>[] = [];
    public addSystem(...system: System<any>[]): void {
        this.systemList.push(...system);
    }
    public addEntityComponents(entity: Entity, ...components: Component[]): void {
        components.forEach(component => entity.addComponent(component)); // Add all of the components to the entity
        let componentKeySet = new Set<string>(components.map(c => c.key)); // Create a set of the keys of the components that have been added
        for (let system of this.systemList) {
            // If any of the system's node component keys are present (same component type), then the system is relevant.
            if (!Array.from(system.NODE_COMPONENT_KEYS).some(componentKey => componentKeySet.has(componentKey)))
                continue;
            // If the system already has a node for this entity, remove it. A new node will be created to include the newly added component. This keeps the node up to date
            if (system.hasNode(entity.getID()))
                system.removeNode(entity.getID());
            // Create the node if all the components are present.
            system.createNode(entity);
        }
    }
    public removeEntityComponents(entity: Entity, ...componentKeys: string[]): void {
        // call system validate after removing components
    }
    public addEntity(entity: Entity): void {
        this.entityMap.set(entity.getID(), entity);
    }
    public removeEntity(entityID: EntityID): void {
        this.entityMap.delete(entityID);
        this.systemList.forEach(system => system.removeNode(entityID));
    }
    public createEntity(...components: Component[]): Entity {
        let entity = new Entity();
        this.addEntityComponents(entity, ...components);
        this.addEntity(entity);
        return entity;
    }
    public update() { }
    public start() { }
    public stop() { }
}

type ResolutionComponent = Component & {
    resolution: Vec2;
}

type PositionComponent = Component & {
    position: Vec2;
}

type TargetPositionComponent = Component & {
    targetPosition: Vec2;
}

type VelocityComponent = Component & {
    velocity: Vec2;
}

type AccelerationComponent = Component & {
    acceleration: Vec2;
}

type ScreenPointComponent = Component & {
    point: Vec2;
}

type ViewportDeadzoneComponent = Component & {
    width: number;
}

type MovementControlInputComponent = Component & {
    movementControlInput: Vec2
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
    acceleration: AccelerationComponent;
    movementControlInput: MovementControlInputComponent;
}

type ViewportSystemNode = {
    position: PositionComponent;
    resolution: ResolutionComponent;
    targetPosition: TargetPositionComponent;
    deadzone: ViewportDeadzoneComponent;
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
    deadzone: ViewportDeadzoneComponent;
}

type StatRenderNode = ParticleStatSystemNode & {
}

class KinematicSystem extends System<KinematicSystemNode> {
    NODE_COMPONENT_KEYS: Set<keyof KinematicSystemNode> = new Set(['position', 'acceleration', 'velocity']);
    public updateNode(node: KinematicSystemNode, entityID: EntityID) {
        const g = GRAVITY;
        const { velocity, acceleration } = node;
        let { x: vX, y: vY } = velocity.velocity;

        // Apply acceleration
        vX += acceleration.acceleration.x * DELTA_TIME;
        vY += acceleration.acceleration.y * DELTA_TIME;
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

        velocity.velocity.x = vX;
        velocity.velocity.y = vY;
    }
}
class PositionSystem extends System<PositionSystemNode> {
    NODE_COMPONENT_KEYS: Set<keyof PositionSystemNode> = new Set(['position', 'velocity']);
    public updateNode(node: PositionSystemNode, entityID: EntityID) {
        node.position.position.x += node.velocity.velocity.x * DELTA_TIME;
        node.position.position.y += node.velocity.velocity.y * DELTA_TIME;
    }
}

class CollisionSystem extends System<CollisionSystemNode> {
    NODE_COMPONENT_KEYS: Set<keyof CollisionSystemNode> = new Set(['particle', 'position', 'velocity', 'world']);
    public updateNode(node: CollisionSystemNode, entityID: EntityID) {
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
    NODE_COMPONENT_KEYS: Set<keyof MovementControlSystemNode> = new Set(['acceleration', 'movementControlInput']);
    public updateNode(node: MovementControlSystemNode, entityID: EntityID) {
        const { acceleration, movementControlInput: input } = node;
        const { x: iX, y: iY } = input.movementControlInput;
        let { x: aX, y: aY } = acceleration.acceleration;

        aX = 0;
        aY = 0;

        if (iX || iY) {
            const factor = ACCELERATION / Math.sqrt(iX ** 2 + iY ** 2);
            aX = factor * iX;
            aY = factor * iY;
        }

        acceleration.acceleration.x = aX;
        acceleration.acceleration.y = aY;
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
    NODE_COMPONENT_KEYS: Set<keyof ViewportSystemNode> = new Set(['position', 'resolution', 'targetPosition', 'deadzone', 'world']);
    public updateNode(node: ViewportSystemNode, entityID: EntityID) {
        let { x, y } = node.position.position;
        const { x: width, y: height } = node.resolution.resolution;
        const { x: targetWorldX, y: targetWorldY } = node.targetPosition.targetPosition;
        const deadzoneWidth = node.deadzone.width;

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

        const worldBorderWidth = node.world.borderWidth;

        let clamp = true;
        // Clamp viewport to world boundaries
        if (clamp) {
            node.position.position.x = Math.max(-worldBorderWidth, Math.min(x, node.world.resolution.x + worldBorderWidth - width / PIXELS_PER_METER));
            node.position.position.y = Math.max(-worldBorderWidth, Math.min(y, node.world.resolution.y + worldBorderWidth - height / PIXELS_PER_METER));
        } else {
            node.position.position.x = x;
            node.position.position.y = y;
        }
    }
}

class ProjectileSystem extends System<ProjectileSystemNode> {
    NODE_COMPONENT_KEYS: Set<keyof ProjectileSystemNode> = new Set(['projectile', 'particle', 'world', 'position']);
    public updateNode(node: ProjectileSystemNode, entityID: EntityID) {
        if (GAME_TIME >= node.projectile.deathTime) {
            destroyProjectile(entityID);
            if (node.projectile.generation == 2)
                return;
            for (let i = 0; i < 2 * Math.PI; i += (2 * Math.PI / 9)) {
                let vX = Math.cos(i) * (0.5 + 0.65 * Math.random());
                let vY = Math.sin(i) * (0.5 + 0.65 * Math.random());
                spawnProjectile(
                    node.world,
                    Vector2.copy(node.position.position),
                    Vector2.scale({ x: vX, y: vY }, MAX_SPEED),
                    node.particle.color,
                    node.particle.radius / 2,
                    node.projectile.deathTime,
                    node.projectile.generation + 1
                );
            }
        }
    }
}

class FiringSystem extends System<FiringSystemNode> {
    NODE_COMPONENT_KEYS: Set<keyof FiringSystemNode> = new Set(['world', 'particle', 'projectileSource', 'fireControl', 'targetPosition', 'velocity', 'position']);
    public updateNode(node: FiringSystemNode, entityID: EntityID) {
        if (!node.fireControl.fireIntent)
            return;

        node.fireControl.fireIntent = false;

        if (GAME_TIME - node.projectileSource.lastFireTime < 1 / PARTICLE_PARAMETERS.projectile.fireRate)
            return

        let direction = Vector2.normalize(Vector2.subtract(node.targetPosition.targetPosition, node.position.position)),
            position = Vector2.add(node.position.position, Vector2.scale(direction, PARTICLE_PARAMETERS.cannon.length)),
            velocity = Vector2.add(Vector2.scale(direction, node.projectileSource.muzzleSpeed), node.velocity.velocity);

        spawnProjectile(
            node.world,
            position,
            velocity,
            node.particle.color,
            node.particle.radius / 2,
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
        const { x, y } = node.position.position;
        CONTEXT.save();

        if (node.projectile.deathTime - GAME_TIME <= 1) {
            let X = (node.projectile.deathTime - GAME_TIME)
            CONTEXT.globalAlpha = lerp(0, Math.sin(1 / (0.01 + X / 10)), 1 - X);
            node.particle.radius *= 1.025;
        }

        CONTEXT.beginPath();
        CONTEXT.arc(x, y, node.particle.radius, 0, 2 * Math.PI);
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
    NODE_COMPONENT_KEYS: Set<keyof ViewportRenderNode> = new Set(['resolution', 'deadzone']);
    public updateNode(node: ViewportRenderNode, entityID: EntityID) {
        const isActive = true;
        if (!isActive)
            return;

        let borderWidth = node.deadzone.width / 10;
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
        const pCannonWidth = pSize * PARTICLE_PARAMETERS.cannon.width;
        const pCannonLength = pSize * PARTICLE_PARAMETERS.cannon.length;

        CONTEXT.save();

        CONTEXT.translate(pX, pY);

        CONTEXT.save();
        // Begin draw cannon

        CONTEXT.rotate(Vector2.angle(node.position.position, node.targetPosition.targetPosition));
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
        CONTEXT.fillStyle = node.particle.color;
        CONTEXT.fill();

        CONTEXT.restore();
    }
}

class StatRenderSystem extends System<StatRenderNode> {
    NODE_COMPONENT_KEYS: Set<keyof StatRenderNode> = new Set(['particleStats']);
    static STATS = {
        isAnimating: (node: StatRenderNode) => isAnimating,
        fps: (node: StatRenderNode) => round(fps),
        position: (node: StatRenderNode) => `${round(node.particleStats.position.x)}, ${round(node.particleStats.position.y)}`,
        velocity: (node: StatRenderNode) => `${round(node.particleStats.computedSpeed)} (${round(node.particleStats.velocity.x)}, ${round(node.particleStats.velocity.y)})`,
        acceleration: (node: StatRenderNode) => `${round(node.particleStats.computedAcceleration)} (${round(node.particleStats.acceleration.x)}, ${round(node.particleStats.acceleration.y)})`,
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

function createParticle(worldComponent: WorldComponent, particleComponent: ParticleComponent, positionComponent: PositionComponent, velocityComponent: VelocityComponent, accelerationComponent: AccelerationComponent, movementControlInputComponent: MovementControlInputComponent, targetPositionComponent: TargetPositionComponent): Entity {
    let computedSpeedComponent = { key: "computedSpeed", computedSpeed: 0 },
        computedAccelerationComponent = { key: "computedAcceleration", computedAcceleration: 0 };
    return engine.createEntity(
        particleComponent,
        positionComponent,
        velocityComponent,
        accelerationComponent,
        movementControlInputComponent,
        targetPositionComponent,
        worldComponent,
        computedSpeedComponent,
        computedAccelerationComponent,
        {
            key: "projectileSource",
            lastFireTime: 0,
            muzzleSpeed: MAX_SPEED,
        } as ProjectileSourceComponent
    );
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

const KEYBOARD_MOVEMENT_CONTROL_INPUT_COMPONENT: MovementControlInputComponent = {
    key: 'movementControlInput',
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
    firingSystem.update();
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

var engine = new Engine();

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

engine.addSystem(
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
        position: Vector2.scale(worldComponent.resolution, 1 / 2)
    };

    (() => {
        let particleComponent1: ParticleComponent = {
            key: "particle",
            radius: PARTICLE_PARAMETERS.radius,
            color: "red"
        }
        let velocityComponent1: VelocityComponent = {
            key: "velocity",
            velocity: { x: 0, y: 0 }
        }
        let accelerationComponent1: AccelerationComponent = {
            key: "acceleration",
            acceleration: { x: 0, y: 0 }
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
            KEYBOARD_MOVEMENT_CONTROL_INPUT_COMPONENT,
            cursorPositionAsTarget
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
            type: "action",
            keys: [0],
            action: () => {
                FIRE_CONTROL.fireIntent = true;
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
                position: Vector2.add(particle1PositionComponent.position, { x: 0.08, y: 0 })
            },
            {
                key: "velocity",
                velocity: { x: 0, y: 0 }
            },
            {
                key: "acceleration",
                acceleration: { x: 0, y: 0 }
            },
            {
                key: "movementControlInput",
                movementControlInput: { x: 0, y: 0 }
            },
            {
                key: "targetPosition",
                get targetPosition() {
                    return particle1PositionComponent.position;
                }
            });
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
            key: "deadzone",
            width: 0.25 * Math.min(canvasWidth, canvasHeight)
        } as ViewportDeadzoneComponent,
        worldComponent
    );

    // CURSOR
    const cursorPositionComponent: PositionComponent = {
        key: "position",
        position: { x: 0, y: 0 }
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
    });

    CANVAS_ELEMENT.addEventListener("mouseup", (event: MouseEvent) => {
        MOUSE_KEY_STATES[event.button] = false;
    });

    animate();
}

init();