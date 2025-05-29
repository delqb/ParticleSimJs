export type Vec2 = { x: number, y: number };
export type EntityID = string;

export function createUID(): EntityID {
    return `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
}

export const Vector2 = {
    create: (x = 0, y = 0): Vec2 => ({ x, y }),

    add: (a: Vec2, b: Vec2): Vec2 => ({ x: a.x + b.x, y: a.y + b.y }),

    subtract: (a: Vec2, b: Vec2): Vec2 => ({ x: a.x - b.x, y: a.y - b.y }),

    scale: (v: Vec2, scalar: number): Vec2 => ({ x: v.x * scalar, y: v.y * scalar }),

    dot: (a: Vec2, b: Vec2): number => a.x * b.x + a.y * b.y,

    magnitude: (v: Vec2): number => Math.sqrt(v.x * v.x + v.y * v.y),

    normalize: (v: Vec2): Vec2 => {
        const mag = Vector2.magnitude(v)
        return mag === 0 ? { x: 0, y: 0 } : { x: v.x / mag, y: v.y / mag }
    },
    distance: (a: Vec2, b: Vec2): number =>
        Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2),

    // the clockwise, radian angle between the positive x axis with vector 'a' as the origin and the line from vector 'a' to vector 'b'
    angle: (a: Vec2, b: Vec2): number => {
        let diff = Vector2.subtract(b, a);
        return Math.atan2(diff.y, diff.x);
    },
    copy: (v: Vec2): Vec2 => {
        return { x: v.x, y: v.y };
    }
}

export type Component = {
    key: string;
};

export type Node = {
    [key: string]: Component
};


export class Entity {
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

export abstract class System<T extends Node> {
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

export class FluidCore {
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


let instance: FluidCore = null;

export function getInstance(): FluidCore {
    if (!instance)
        throw new Error("An Engine instance has not been created!");

    return instance;
}

export function setInstance(newInstance: FluidCore) {
    if (instance)
        throw new Error("An Engine instance has already been created!");
    instance = newInstance;
}