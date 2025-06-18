import {PositionComponent, SpriteComponent} from "@asteroid/components";
import {EntityID, System} from "@fluidengine/core";
import {OrderedList} from "@fluidengine/lib/structures";

type SpriteSystemNode = {
    position: PositionComponent;
    spriteTexture: SpriteComponent;
}

export class SpriteRenderSystem extends System<SpriteSystemNode> {
    NODE_COMPONENT_KEYS: Set<keyof SpriteSystemNode> = new Set([
        "position",
        "spriteTexture"
    ]);

    private sortedNodeList: OrderedList<[EntityID, SpriteSystemNode]> = new OrderedList();
    constructor(private renderContext: CanvasRenderingContext2D) {
        super();
    }

    public addNode(entityID: EntityID, node: SpriteSystemNode): void {
        super.addNode(entityID, node);
        this.sortedNodeList.add([entityID, node], node.spriteTexture.zIndex);
    }

    public removeNode(entityID: EntityID): boolean {
        if (this.hasNode(entityID)) {
            let itemList = this.sortedNodeList.getItemList();
            const index = itemList.findIndex(o => o.item[0] === entityID);
            if (index !== -1)
                itemList.splice(index, 1);
        }
        return super.removeNode(entityID);
    }

    public updateNode(node: SpriteSystemNode, entityID: EntityID) {
        const { position, spriteTexture: texture } = node;
        const { x, y } = position.position;
        const transform = texture.transform;
        const img = texture.image;
        const ctx = this.renderContext;

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(position.rotation);

        if (transform) {
            const { translate: trans, rotate: rot, scale } = transform;
            if (rot) ctx.rotate(rot);
            if (trans) ctx.translate(trans.x, trans.y);
            if (scale) ctx.scale(scale, scale);
        }

        ctx.drawImage(img, -img.width / 2, -img.height / 2);
        ctx.restore();
    }

    public update(): void {
        this.sortedNodeList.getAll().forEach(([entityID, node]) => this.updateNode(node, entityID));
    }
}