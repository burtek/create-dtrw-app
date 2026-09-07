// export function mapValues<Key extends string, Value, MappedValue>(
//     obj: Record<Key, Value>,
//     map: (value: Value, key: Key) => MappedValue
// ): Record<Key, MappedValue> {
// }


function objectEntries<Key extends string, Value>(
    object: Record<Key, Value>
): [Key, Value][] {
    return Object.entries(object) as [Key, Value][];
}
function fromEntries<Key extends string, Value>(
    array: [Key, Value][]
): Record<Key, Value> {
    return Object.fromEntries(array) as Record<Key, Value>;
}

export class ObjectIterator<Key extends string, Value, IsPartial extends boolean = false> {
    constructor(private object: Record<Key, Value>) {}

    map<MappedValue>(
        mapper: (value: Value, key: Key) => MappedValue
    ): ObjectIterator<Key, MappedValue, IsPartial> {
        const entries = objectEntries(this.object);
        const mapped = entries.map(([key, value]) => [key, mapper(value, key)] as [Key, MappedValue]);
        return new ObjectIterator(fromEntries(mapped));
    }

    filter<NarrowedValue extends Value>(predicate: (value: Value, key: Key) => value is NarrowedValue): ObjectIterator<Key, NarrowedValue, IsPartial>;
    filter<NarrowedKey extends Key>(predicate: (value: Value, key: Key) => key is NarrowedKey): ObjectIterator<NarrowedKey, Value, IsPartial>;
    filter(predicate: (value: Value, key: Key) => boolean): ObjectIterator<Key, Value, true>;
    filter(predicate: (value: Value, key: Key) => boolean) {
        const entries = objectEntries(this.object);
        const filtered = entries.filter(([key, value]) => predicate(value, key));
        return new ObjectIterator(fromEntries(filtered));
    }

    value(): IsPartial extends true ? Partial<Record<Key, Value>> : Record<Key, Value> {
        return this.object;
    }
}
