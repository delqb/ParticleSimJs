import { System, EntityID, OrderedList } from "../../../engine/FluidECS.js";
import { PositionComponent, ScaleComponent, SpriteComponent } from "../../Components.js";

type SpriteSystemNode = {
    position: PositionComponent;
    scale: ScaleComponent;
    spriteTexture: SpriteComponent;
}

export class SpriteRenderSystem extends System<SpriteSystemNode> {
    NODE_COMPONENT_KEYS: Set<keyof SpriteSystemNode> = new Set([
        "position",
        "scale",
        "spriteTexture"
    ]);

    private sortedNodeList: OrderedList<[EntityID, SpriteSystemNode]> = new OrderedList();
    constructor(private ctx: CanvasRenderingContext2D) {
        super();
    }

    public addNode(entityID: EntityID, node: SpriteSystemNode): void {
        super.addNode(entityID, node);
        this.sortedNodeList.add([entityID, node], node.spriteTexture.zIndex);
    }

    public removeNode(entityID: EntityID): boolean {
        if (this.hasNode(entityID)) {
            let node = this.getNode(entityID);
            this.sortedNodeList.remove([entityID, node]);
        }
        return super.removeNode(entityID);
    }

    public updateNode(node: SpriteSystemNode, entityID: EntityID) {
        let { position, scale, spriteTexture } = node;
        let { x, y } = position.position;
        let { x: scaleX, y: scaleY } = scale.scale;
        let { texture } = spriteTexture;

        this.ctx.save();
        this.ctx.translate(x, y);
        this.ctx.rotate(-position.rotation);
        this.ctx.scale(scaleX, scaleY);
        this.ctx.drawImage(texture, -texture.width / 2, -texture.height / 2);
        this.ctx.restore();
    }

    public update(): void {
        this.sortedNodeList.getAll().forEach(([entityID, node]) => this.updateNode(node, entityID));
    }
}