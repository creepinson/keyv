"use strict";

import { EventEmitter } from "events";
import { Expression } from "safe-filter";

export type FieldData = {
    name: string;
    type: string;
    localize: boolean;
    options: unknown[];
};

export type CollectionData<T> = {
    fields: FieldData[];
    entries: T[];
    total: number;
};

export abstract class ContentStore {
    protected collections: Record<string, Collection<unknown>>;
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
            const collections: Record<string, Collection<unknown>> = {};
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
    abstract col<T>(name: string): Collection<T>;
}

export abstract class Collection<T> {
    store: ContentStore;
    name: string;

    constructor(store: ContentStore, collectionName: string) {
        this.store = store;
        this.name = collectionName;
    }

    /**
     * Fetches a collection from the provided content store.
     */
    abstract async fetch(): Promise<CollectionData<T> | undefined>;

    /**
     * Fetches entries of a collection from the provided content store.
     * If the query is specified it will filter out fields that do not match this query.
     * @param query Can be {} or a key-value map of the fields to match against.
     */
    abstract async fetchEntries(query: Expression): Promise<T[]>;
}
