import { ECSArchetype } from "@fluidengine/core/archetype";
import { ECSComponentType } from "@fluidengine/core/component";

export class FluidArchetype implements ECSArchetype {
    constructor(
        private bitSet: bigint = 0n
    ) {
    }

    static validateNumericId(numId: number): number {
        if (numId < 0 || numId > 1023) {
            throw new RangeError(`Component ID ${numId} is out of supported bitmask bounds.`);
        }
        return numId;
    }

    static getBitPosition<T>(componentType: ECSComponentType<T>): bigint {
        return BigInt(FluidArchetype.validateNumericId(componentType.getId().getNumericId()));
    }

    static getBitMask<T>(componentType: ECSComponentType<T>): bigint {
        return 1n << FluidArchetype.getBitPosition(componentType);
    }

    static computeArchetypeBitSet(componentTypes: Iterable<ECSComponentType<any>>): bigint {
        let bitSet = 0n;
        for (const componentType of componentTypes) {
            bitSet |= FluidArchetype.getBitMask(componentType);
        }
        return bitSet;
    }

    getBitSet(): bigint {
        return this.bitSet;
    }

    has<T>(componentType: ECSComponentType<T>): boolean {
        return (this.bitSet & FluidArchetype.getBitMask(componentType)) !== 0n;
    }

    equals(other: ECSArchetype): boolean {
        return (other instanceof FluidArchetype && other.bitSet === this.bitSet);
    }

    isSuperSetOf(other: ECSArchetype): boolean {
        return (
            other instanceof FluidArchetype &&
            (this.bitSet & other.bitSet) === other.bitSet
        );
    }

    with<T>(componentType: ECSComponentType<T>): ECSArchetype {
        return new FluidArchetype(this.bitSet | FluidArchetype.getBitMask(componentType));
    }

    without<T>(componentType: ECSComponentType<T>): ECSArchetype {
        return new FluidArchetype(this.bitSet & ~FluidArchetype.getBitMask(componentType));
    }
}