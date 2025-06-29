export function* getLazyMappedIterable<T, U>(source: Iterable<T>, map: (item: T) => U): Iterable<U> {
    for (const item of source) {
        yield map(item);
    }
}