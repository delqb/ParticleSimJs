import { OrderedList } from "@fluid/core/util/OrderedList";

export type OrderedArrayListItem<T> = {
    item: T;
    order: number;
}

export class OrderedArrayList<T> implements OrderedList<T> {
    private items: OrderedArrayListItem<T>[] = [];
    private itemSet: Set<T> = new Set();

    constructor(
        initialItems: OrderedArrayListItem<T>[] = [],
        private readonly compareFn: (a: number, b: number) => number = (a, b) => a - b
    ) {
        this.items = initialItems.slice().sort((a, b) => this.compareFn(a.order, b.order));
    }

    getItemList() {
        return this.items;
    }

    insertItem(entry: OrderedArrayListItem<T>) {
        const index = this.findInsertionIndex(entry.order);
        this.items.splice(index, 0, entry);
        this.itemSet.add(entry.item);
    }

    // Insert with binary search to maintain order
    insert(item: T, order: number) {
        this.insertItem({ item, order });
    }

    has(value: T): boolean {
        return this.itemSet.has(value);
    }

    // Binary search for insertion point
    findInsertionIndex(order: number): number {
        let left = 0, right = this.items.length;
        while (left < right) {
            const mid = (left + right) >>> 1;
            if (this.items[mid].order > order) {
                right = mid;
            } else {
                left = mid + 1;
            }
        }
        return left;
    }

    // Access all in priority order
    getAll(): T[] {
        return this.items.map(o => o.item);
    }

    // Fast lookup by index
    get(index: number): T | undefined {
        return this.items[index]?.item;
    }

    remove(value: T) {
        if (!this.itemSet.has(value))
            return;
        const index = this.items.findIndex(o => Object.is(o.item, value));
        if (index !== -1) this.items.splice(index, 1);
    }

    getSize(): number {
        return this.items.length;
    }

    clear(): void {
        this.items.length = 0;
    }

    at(index: number): OrderedArrayListItem<T> | undefined {
        return this.items[index];
    }

    entries(): Iterable<OrderedArrayListItem<T>> {
        return this.items.values();
    }
}