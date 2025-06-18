export * from "./core";

import {Component, createUID, Entity, EntityID, System, SystemPhase} from "./core";
import {OrderedList} from "./lib/structures";

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
        let entity = new Entity(createUID());
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
                        console.error(error.stack);
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