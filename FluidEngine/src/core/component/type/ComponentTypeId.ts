export interface ECSComponentTypeId {
    /**
     * Determines whether the given id is considered equal to this instance.
     * 
     * @returns true if the given id is considered equal to this instance.
     */
    equals(other: ECSComponentTypeId): boolean;

    /**
     * @returns a human-readable, descriptive label for this identity.
     */
    getName(): string;

    /**
     * Provides a number that is presumed to be unique in some context and may be used for identity-related logic and math, 
     * such as sorting or bitsets if the number is incremental and produced in a contiguous manner.
     * 
     * @returns a number that may be unique in a given context.
     */
    getNumericId(): number;

    /**
     * Provides a unique symbol for this id to be used in hashes, as keys in maps, and within objects as a runtime identifer.
     * 
     * @returns a unique symbol for this id.
     */
    getSymbol(): symbol;

    /**
     * Provides a unique string representing this id that may be suitable for serialization.
     * 
     * @returns a unique string representation of this id.
     */
    toString(): string;
}