import { Expression, matches } from "safe-filter";
import { Item } from "./item";
import {
    Collection,
    CollectionData,
    ContentStore,
    FieldData,
    RetrievalInfo,
    RetrievalResult,
} from "./types";
import { Observable, of } from "rxjs";
import { map } from "rxjs/operators";

export const loadStore = async (
    opts:
        | {
              adapter?: string;
              uri?: string;
          }
        | Record<string, string>,
): Promise<ContentStore> => {
    // No options provided, just return a default store object
    if (!opts) return new MemoryStore();

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

    col<T extends Item>(name: string): MemoryCollection<T> {
        if (!this.collections[name])
            this.collections[name] = new MemoryCollection(this, name);
        return this.collections[name] as MemoryCollection<T>;
    }
}

export class MemoryCollection<T extends Item> extends Collection<
    T,
    MemoryStore
> {
    data: Record<string, any>;

    constructor(store: MemoryStore, collectionName: string) {
        super(store, collectionName);
        this.data = {};
    }

    fetch(): Observable<RetrievalResult<T>> {
        return of({
            message: "Successfully retrieved data",
            info: { collectionName: this.name },
            status: true,
            data: {
                entries: Object.values(this.data),
                fields: Object.keys(this.data).map((d) => {
                    return {
                        name: d,
                        type: typeof d,
                        options: {},
                        localize: false,
                    } as FieldData;
                }),
            },
        });
    }

    fetchEntries(query?: Expression): Observable<T[]> {
        return this.fetch()
            .pipe(map((result) => result.data.entries as T[]))
            .pipe(
                map((entries) =>
                    entries.filter((e) => (query ? matches(query, e) : true)),
                ),
            );
    }
}

export * from "./types";
export * from "./item";
