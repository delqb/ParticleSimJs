export interface ECSEntityId {
    equals(other: ECSEntityId): boolean;

    getSymbol(): symbol;

    /**
     * @returns a unique string representation of this entity id.
     */
    toString(): string;
}
