export type Vec2 = { x: number, y: number };
export type EntityID = string;

export function createUID(): EntityID {
    return `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
}

export const Vector2 = {
    create: (x = 0, y = 0): Vec2 => ({ x, y }),

    add: (a: Vec2, b: Vec2): Vec2 => ({ x: a.x + b.x, y: a.y + b.y }),

    subtract: (a: Vec2, b: Vec2): Vec2 => ({ x: a.x - b.x, y: a.y - b.y }),

    multiply: (a: Vec2, b: Vec2): Vec2 => ({ x: a.x * b.x, y: a.y * b.y }),

    divide: (a: Vec2, b: Vec2): Vec2 => ({ x: a.x / b.x, y: a.y / b.y }),

    scale: (v: Vec2, scalar: number): Vec2 => ({ x: v.x * scalar, y: v.y * scalar }),

    dot: (a: Vec2, b: Vec2): number => a.x * b.x + a.y * b.y,

    abs: (v: Vec2): Vec2 => ({ x: Math.abs(v.x), y: Math.abs(v.y) }),

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

    fromAngle: (t: number): Vec2 => ({ x: Math.cos(t), y: Math.sin(t) }),

    copy: (v: Vec2): Vec2 => {
        return { x: v.x, y: v.y };
    }
}

export const MathUtils = {
    round: (num: number, decimalPlaces = 3): number => {
        return Math.round(num * 10 ** decimalPlaces) / 10 ** decimalPlaces;
    },

    lerp: (start: number, end: number, t: number): number => {
        return start + (end - start) * t;
    }
}

export type Component = {
    key: string;
};

export type Node<T extends Record<string, Component>> = T;


export class Entity {
    private id: EntityID = createUID();
    private components = new Map<string, Component>();
    private removed: boolean = false;

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

    isRemoved() {
        return this.removed;
    }

    setRemoved(removed: boolean) {
        this.removed = removed;
    }
}


export abstract class System<T extends Node<any>> {
    abstract readonly NODE_COMPONENT_KEYS: Set<Extract<keyof T, string>>;

    private nodeMap: Map<EntityID, T> = new Map();

    public createNode(entity: Entity): T | null {
        const node = {} as T;
        for (const key of this.NODE_COMPONENT_KEYS) {
            const component = entity.getComponent(key);
            if (!component)
                return null;
            node[key] = component as T[typeof key];
        }
        this.addNode(entity.getID(), node);
        return node;
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
    public getNode(entityID: EntityID): T | undefined {
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
        this.nodeMap.forEach(this.updateNode.bind(this));
    }
    public abstract updateNode(node: T, entityID: EntityID): void;
}

export type OrderedListItem<T> = {
    item: T;
    order: number;
}

export class OrderedList<T> {
    private items: OrderedListItem<T>[] = [];

    constructor(initialItems: OrderedListItem<T>[] = []) {
        this.items = initialItems.slice().sort((a, b) => a.order - b.order);
    }

    // Insert with binary search to maintain order
    insert(item: OrderedListItem<T>) {
        const index = this.findInsertIndex(item.order);
        this.items.splice(index, 0, item);
    }

    includes(value: T): boolean {
        return this.items.some(i => i.item == value);
    }

    add(item: T, order: number) {
        this.insert({ item, order });
    }

    // Binary search for insertion point
    private findInsertIndex(order: number): number {
        let left = 0, right = this.items.length;
        while (left < right) {
            const mid = (left + right) >>> 1;
            if (this.items[mid].order > order) {
                right = mid;
            } else {
                left = mid + 1;
            }
        }
        return left;
    }

    // Access all in priority order
    getAll(): T[] {
        return this.items.map(o => o.item);
    }

    // Fast lookup by index
    get(index: number): T | undefined {
        return this.items[index]?.item;
    }

    remove(value: T) {
        const index = this.items.findIndex(o => o.item === value);
        if (index !== -1) this.items.splice(index, 1);
    }

    size(): number {
        return this.items.length;
    }
}

export interface SystemPhase {
    key: string;
    order: number;
    preUpdate?(): void;
    postUpdate?(): void;
}

export class FluidCore {
    private entityMap: Map<EntityID, Entity> = new Map();
    private phaseList: OrderedList<SystemPhase> = new OrderedList();
    private systemPhaseMap: Map<SystemPhase, OrderedList<System<any>>> = new Map();

    public hasPhase(phase: SystemPhase) {
        return this.systemPhaseMap.has(phase);
    }

    public addPhase(...phases: SystemPhase[]) {
        for (let phase of phases) {
            if (this.hasPhase(phase))
                throw new Error(`Phase '${phase.key}' already exists!`);

            this.phaseList.add(phase, phase.order);
            this.systemPhaseMap.set(phase, new OrderedList());
        }
    }

    public removePhase(phase: SystemPhase) {
        if (!this.hasPhase(phase))
            throw new Error(`Phase '${phase.key}' does not exist!`);

        this.phaseList.remove(phase);
        this.systemPhaseMap.delete(phase);
    }

    public addSystem(phase: SystemPhase, system: System<any>, order: number): void {
        if (!this.hasPhase(phase))
            throw new Error(`Phase '${phase.key}' has not been added!`);

        let l = this.systemPhaseMap.get(phase);
        if (!l.includes(system))
            l.add(system, order);
    }

    public appendSystems(phase: SystemPhase, ...systems: System<any>[]): void {
        if (!this.hasPhase(phase))
            throw new Error(`Phase '${phase.key}' has not been added!`);

        let l = this.systemPhaseMap.get(phase);
        let o = l.size();
        for (let i = 0; i < systems.length; i++) {
            let system = systems[i];
            if (!l.includes(system))
                l.add(system, o + i);
        }
    }

    public removeSystem(phase: SystemPhase, system: System<any>) {
        this.systemPhaseMap.get(phase)?.remove(system);
    }

    public getSystemList(phase: SystemPhase): OrderedList<System<any>> | undefined {
        return this.systemPhaseMap.get(phase);
    }

    public getAllSystems(): System<any>[] {
        return Array.from(this.systemPhaseMap.values()).map(oL => oL.getAll()).flat();
    }

    public addEntityComponents(entity: Entity, ...components: Component[]): void {
        components.forEach(component => entity.addComponent(component)); // Add all of the components to the entity
        for (let system of this.getAllSystems()) {
            let id = entity.getID();
            if (system.hasNode(id)) {
                if (!system.validateEntity(entity))
                    system.removeNode(id);
                continue;
            }
            if (system.validateEntity(entity))
                system.createNode(entity);
        }
    }
    public removeEntityComponents(entity: Entity, ...componentKeys: string[]): void {
        componentKeys.forEach(c => entity.removeComponent(c));
        for (let system of this.getAllSystems()) {
            if (!system.hasNode(entity.getID()))
                continue;
            if (!system.validateEntity(entity))
                system.removeNode(entity.getID());
        }
    }
    public addEntity(entity: Entity): void {
        this.entityMap.set(entity.getID(), entity);
    }
    public removeEntity(entityID: EntityID): void {
        this.entityMap.delete(entityID);
        this.getAllSystems().forEach(system => system.removeNode(entityID));
    }
    public createEntity(...components: Component[]): Entity {
        let entity = new Entity();
        this.addEntityComponents(entity, ...components);
        this.addEntity(entity);
        return entity;
    }
    public update() {
        for (let phase of this.phaseList.getAll()) {
            try {
                phase.preUpdate?.();
                this.systemPhaseMap.get(phase).getAll().forEach(system => {
                    try {
                        system.update();
                    } catch (error) {
                        console.error("An error has occurred while updating system: " + system);
                        console.log(error);
                    }
                });
                phase.postUpdate?.();
            } catch (error) {
                console.error("An error has occurred during a phase update: " + phase.key);
                console.log(error);
            }
        }
        this.entityMap.values().filter(e => e.isRemoved()).forEach(e => this.removeEntity(e.getID()));
    }
}