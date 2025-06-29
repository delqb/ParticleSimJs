import { ECSEntityFactory } from "@fluid/core/entity/EntityFactory";
import { ECSEntityId } from "@fluid/core/entity/EntityId";
import { FluidEntityId } from "./FluidEntityId";

export class FluidEntityFactory implements ECSEntityFactory {
    private static readonly prefix = "FluidEntity";
    private readonly tag: string;
    constructor(
    ) {
        this.tag = `${FluidEntityFactory.prefix}_`;
    }

    createEntityId(): ECSEntityId {
        const tag = this.tag;
        const stringId = tag + Date.now();
        return new FluidEntityId(stringId);
    }
}