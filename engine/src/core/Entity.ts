import { Component } from "./Component";

export type EntityID = string;

export function createUID(): EntityID {
    return `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
}

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