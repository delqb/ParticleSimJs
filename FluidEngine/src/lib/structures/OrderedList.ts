export type OrderedListItem<T> = {
    item: T;
    order: number;
}

export class OrderedList<T> {
    private items: OrderedListItem<T>[] = [];

    constructor(initialItems: OrderedListItem<T>[] = []) {
        this.items = initialItems.slice().sort((a, b) => a.order - b.order);
    }

    getItemList() {
        return this.items;
    }

    // Insert with binary search to maintain order
    insert(item: OrderedListItem<T>) {
        const index = this.findInsertIndex(item.order);
        this.items.splice(index, 0, item);
    }

    includes(value: T): boolean {
        return this.items.some(i => i.item == value);
    }

    add(item: T, order: number) {
        this.insert({ item, order });
    }

    // Binary search for insertion point
    private findInsertIndex(order: number): number {
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
        const index = this.items.findIndex(o => o.item === value);
        if (index !== -1) this.items.splice(index, 1);
    }

    size(): number {
        return this.items.length;
    }
}