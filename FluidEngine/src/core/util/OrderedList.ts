export interface OrderedList<T> {
    has(value: T): boolean;
    get(index: number): T;
    getAll(): Iterable<T>;
    insert(value: T, order: number): void;
    remove(value: T): void;
    findInsertionIndex(order: number): number;
    getSize(): number;
    clear(): void;
}