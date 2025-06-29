export interface ECSNodeSchemaId {
    equals(other: ECSNodeSchemaId): boolean;

    getName(): string;
    getSymbol(): symbol;
}