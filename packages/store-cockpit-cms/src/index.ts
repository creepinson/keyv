import axios from "axios";
import { Expression, matches } from "safe-filter";
import {
    ContentStore,
    Collection,
    CollectionData,
    Item,
    RetrievalResult,
} from "@throw-out-error/storez";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";

/**
 * An api that interfaces with https://getcockpit.com,
 * a self-hosted & free CMS (content management system).
 * This api library provides typescript type definitions
 * so you don't need to cast it yourself.
 * However, you still need to create a type definition
 * for each collection (eg. BlogPost).
 */
export class CockpitStore extends ContentStore {
    constructor(opts: { apiToken: string; apiBaseUrl: string }) {
        super(opts);
        this.options.apiUrl = opts.apiBaseUrl + "/api";
    }

    /**
     * Fetches a collection from the cockpit CMS.
     * @param name the name of the collection
     */
    col<T extends Item>(name: string): Collection<T, CockpitStore> {
        if (!this.collections[name])
            this.collections[name] = new CockpitCollection(this, name);
        return this.collections[name] as Collection<T, CockpitStore>;
    }
}

export class CockpitCollection<T extends Item> extends Collection<
    T,
    CockpitStore
> {
    /**
     * Fetches a collection from the provided cockpit content api.
     */
    fetch(): Observable<RetrievalResult<T>> {
        return new Observable((observer) => {
            axios
                .get(
                    `${this.store.options.apiUrl}/collections/get/${this.name}?token=${this.store.options.apiToken}`,
                )
                .then((response) => response.data)
                .then((data) => {
                    let transformedData: CollectionData<T> = data as CollectionData<
                        T
                    >;
                    transformedData.entries = transformedData.entries.map(
                        (e) => ({
                            ...e,
                            id: (e as any)._id,
                        }),
                    );
                    if (transformedData)
                        observer.next({
                            info: {
                                collectionName: this.name,
                            },
                            message: "Succesfully retrieved data",
                            status: true,
                            data: transformedData,
                        });
                })
                .catch((e) => {
                    observer.next({
                        info: {
                            collectionName: this.name,
                        },
                        status: false,
                        message: e.message,
                    });
                });
        });
    }

    /**
     * Fetches entries of a collection from the provided cockpit content api.
     * If the query is specified it will filter out fields that do not match this query.
     * @param query Can be {} or a key-value map of the fields to match against.
     */
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

export default CockpitStore;
