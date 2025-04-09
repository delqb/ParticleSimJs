type Point2D = { x: number, y: number };
export type Position = Point2D;
export type Velocity = Point2D;

export type UID = string;
export type EntityID = UID;

export function createUID(): UID {
    return `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
}

interface GSystem {
    nodes: SystemNode[];
    nodeFactory
    isTarget(entityID: EntityID, context: EngineCore): boolean;
    update(): void;
}

type SystemNode = {
    entityID: EntityID
}

type MotionSystemNode = SystemNode & {
    position: Position, velocity: Velocity
}

class MotionSystem implements GSystem {
    nodes: MotionSystemNode[];
    constructor(nodes: MotionSystemNode[]) {
        this.nodes = nodes;
    }
    update(): void {

    }
}

class EngineCore {
    systems: GSystem[];
    positionComponents: Map<EntityID, Position>;
    velocityComponents: Map<EntityID, Velocity>;
    constructor() {
        this.systems = [];
        this.positionComponents = new Map<EntityID, Position>();
        this.velocityComponents = new Map<EntityID, Velocity>();
    }
    createEntity(): EntityID {
        return createUID();
    }

    update(): void {

    }

}