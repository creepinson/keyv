"use strict";

import { Observable } from "rxjs";
import { Expression } from "safe-filter";
import { Item } from "./item";

export type FieldData = {
    name: string;
    type: string;
    localize?: boolean;
    options?: unknown[];
};

export type CollectionData<T> = {
    fields: FieldData[];
    entries: T[];
};

export abstract class ContentStore {
    protected collections: Record<string, Collection<Item, ContentStore>>;
    options: Record<string, unknown>;

    constructor(opts: Record<string, unknown> = {}) {
        this.options = opts;
        this.collections = {};
    }

    /**
     * Converts this store to a clean json object that can be logged.
     */
    toJson() {
        const printCollections = () => {
            const collections: Record<
                string,
                Collection<Item, ContentStore>
            > = {};
            for (let k in this.collections) {
                const c = this.collections[k];
                delete c.store;
                collections[k] = c;
            }
            return collections;
        };

        return {
            collections: printCollections(),
            options: this.options,
        };
    }

    /**
     * Fetches a collection from the cockpit CMS.
     * @param name the name of the collection
     */
    abstract col<T extends Item>(name: string): Collection<T, ContentStore>;
}

export abstract class Collection<T extends Item, S extends ContentStore> {
    store: S;
    name: string;

    constructor(store: S, collectionName: string) {
        this.store = store;
        this.name = collectionName;
    }

    /**
     * Fetches a collection from the provided content store.
     */
    abstract fetch(): Observable<RetrievalResult<T>>;

    /**
     * Fetches entries of a collection from the provided content store.
     * If the query is specified it will filter out fields that do not match this query.
     * @param query Can be {} or a key-value map of the fields to match against.
     */
    abstract fetchEntries(query?: Expression): Observable<T[]>;
}

export type RetrievalResult<T> = {
    message: string;
    status: boolean;
    info: RetrievalInfo;
    data?: CollectionData<T> | T[];
};

export type RetrievalInfo = {
    collectionName?: string;
};
