import {Entity, EntityID} from "./Entity";
import {Node} from "./Node";

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