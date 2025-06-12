export * from "./util/Vector2.js";
export * from "./util/OrderedList.js";

import { OrderedList } from "./util/OrderedList.js";

export type EntityID = string;

export function createUID(): EntityID {
    return `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
}

export const MathUtils = {
    PI2: Math.PI * 2,

    shortestAngleDiff: (a: number, b: number): number => {
        const PI2 = MathUtils.PI2;
        let diff = (b - a) % PI2;
        if (diff > Math.PI) diff -= PI2;
        if (diff < -Math.PI) diff += PI2;
        return diff;
    },
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
    private removed: boolean = false;

    constructor(private id: EntityID, private components: Map<string, Component>) {
    }

    getID(): EntityID {
        return this.id;
    }

    hasComponents(keys: string[]): boolean {
        return keys.every(key => this.components.has(key));
    }

    getComponent<T extends Component>(key: string): T | undefined {
        return this.components.get(key) as T;
    }

    addComponents(...components: Component[]): void {
        components.forEach(component => this.components.set(component.key, component));
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

    public isValidEntity(entity: Entity): boolean {
        return entity.hasComponents(Array.from(this.NODE_COMPONENT_KEYS));
    }

    public updateEntityMembership(entity: Entity): boolean {
        let id = entity.getID();
        let isValid = this.isValidEntity(entity);
        if (this.hasNode(id) && !isValid) {
            this.removeNode(id);
        } else if (!this.hasNode(id) && isValid) {
            this.createNode(entity);
        }
        return isValid;
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

    public getEntityMap(): Map<EntityID, Entity> {
        return this.entityMap;
    }

    public getAllEntities(): Entity[] {
        return Array.from(this.entityMap.values());
    }

    public getEntityByID(entityID: EntityID): Entity | undefined {
        return this.entityMap.get(entityID);
    }

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

    public updateSystemEntityMemberships(entity: Entity) {
        this.getAllSystems().forEach(system => system.updateEntityMembership(entity))
    }

    public addEntityComponents(entity: Entity, ...components: Component[]): void {
        entity.addComponents(...components); // Add all of the components to the entity
        this.updateSystemEntityMemberships(entity);
    }

    public removeEntityComponents(entity: Entity, ...componentKeys: string[]): void {
        componentKeys.forEach(c => entity.removeComponent(c));
        this.updateSystemEntityMemberships(entity);
    }

    public addEntity(entity: Entity): void {
        let id = entity.getID();
        if (this.entityMap.has(id))
            throw new Error("Entity already exists: " + id);
        this.entityMap.set(id, entity);
        this.updateSystemEntityMemberships(entity);
    }

    public removeEntity(entityID: EntityID): boolean {
        if (!this.entityMap.has(entityID))
            return false;
        this.entityMap.delete(entityID);
        this.getAllSystems().forEach(system => system.removeNode(entityID));
        return true;
    }

    public createNewEntityFromComponents(...components: Component[]): Entity {
        let entity = new Entity(createUID(), new Map());
        entity.addComponents(...components);
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
                        console.error(`An error has occurred while updating system: ${system}\n${error}`);
                    }
                });
                phase.postUpdate?.();
            } catch (error) {
                console.error(`An error has occurred during a phase update: ${phase.key}\n${error}`);
            }
        }
        // THIS IS BUGGED
        // const toRemove = Array.from(this.entityMap.values()).filter(e => e.isRemoved()).map(e => e.getID());
        // toRemove.forEach(id => this.removeEntity(id));
    }
}