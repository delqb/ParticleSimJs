import { ECSComponentTypeId } from "@fluid/core/component/type/ComponentTypeId";

export class FluidComponentTypeId implements ECSComponentTypeId {
    private static readonly prefix: string = "FluidComponentType";
    private readonly symbolId: symbol;
    private readonly stringified: string;

    constructor(
        private readonly name: string,
        private readonly numericId: number
    ) {
        this.stringified = `${FluidComponentTypeId.prefix}#${numericId}-${name}`;
        this.symbolId = Symbol(this.stringified);
    }

    getSymbol(): symbol {
        return this.symbolId;
    }
    getNumericId(): number {
        return this.numericId;
    }
    getName(): string {
        return this.name;
    }
    equals(other: ECSComponentTypeId): boolean {
        return (other instanceof FluidComponentTypeId && other.symbolId === this.symbolId);
    }
    toString(): string {
        return this.stringified;
    }
}