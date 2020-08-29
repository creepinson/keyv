import { Expression, matches } from "safe-filter";
import { Collection, CollectionData, ContentStore, FieldData } from "./types";

export const loadStore = async (
    opts:
        | {
              adapter?: string;
              uri?: string;
          }
        | Record<string, string>,
): Promise<ContentStore> => {
    const adapters = {
        cockpit: "@throw-out-error/store-cockpit-cms",
    };
    if (opts.adapter || opts.uri) {
        const adapter = opts.adapter || /^[^:]*/.exec(opts.uri)[0];
        const store = (await import(adapters[adapter])).default;
        return new store(opts);
    }

    return new MemoryStore();
};

export class MemoryStore extends ContentStore {
    constructor() {
        super();
    }

    col<T>(name: string): Collection<T> {
        return new MemoryCollection<T>(this, name);
    }
}

export class MemoryCollection<T> extends Collection<T> {
    data: Record<string, any>;

    constructor(store: MemoryStore, collectionName: string) {
        super(store, collectionName);
        this.data = {};
    }

    async fetch(): Promise<CollectionData<T>> {
        return {
            entries: Object.values(this.data),
            fields: Object.keys(this.data).map((d) => {
                return {
                    name: d,
                    type: typeof d,
                    options: {},
                    localize: false,
                } as FieldData;
            }),
            total: this.data.length,
        };
    }

    async fetchEntries(query?: Expression): Promise<T[]> {
        const data = await this.fetch();
        if (data) {
            return data.entries
                .filter((e) => (query ? matches(query, e) : true))
                .map((e: T) => {
                    return e;
                });
        } else return [];
    }
}

export * from "./types";
