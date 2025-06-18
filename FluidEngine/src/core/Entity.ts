import {Component} from "./Component";

export type EntityID = string;

export function createUID(): EntityID {
    return `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
}

export class Entity {
    private removed: boolean = false;
    private components: Map<string, Component> = new Map();
    private componentKeySet: Set<string> = new Set();

    constructor(private id: EntityID) {
    }

    getID(): EntityID {
        return this.id;
    }

    getComponent<T extends Component>(key: string): T | undefined {
        return this.components.get(key) as T;
    }

    addComponent(component: Component): void {
        this.components.set(component.key, component);
        this.componentKeySet.add(component.key);
    }

    addComponents(...components: Component[]): void {
        components.forEach(component => {
            this.addComponent(component);
        });
    }

    hasComponent(key: string): boolean {
        return this.componentKeySet.has(key);
    }

    hasComponents(keys: string[]): boolean {
        return keys.every(key => this.componentKeySet.has(key));
    }

    removeComponent(key: string): boolean {
        this.componentKeySet.delete(key);
        return this.components.delete(key);
    }

    getComponentSignature(): ReadonlySet<string> {
        return this.componentKeySet;
    }

    isRemoved() {
        return this.removed;
    }

    setRemoved(removed: boolean) {
        this.removed = removed;
    }
}