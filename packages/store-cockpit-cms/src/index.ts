import axios from "axios";
import { Expression, matches } from "safe-filter";
import {
    ContentStore,
    Collection,
    CollectionData,
    Item,
} from "@throw-out-error/storez";

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
    async fetch(): Promise<CollectionData<T> | undefined> {
        try {
            const { data } = await axios.get(
                `${this.store.options.apiUrl}/collections/get/${this.name}?token=${this.store.options.apiToken}`,
            );
            let transformedData: CollectionData<T> = data as CollectionData<T>;
            transformedData.entries = transformedData.entries.map(e => e.id = (e as any)._id)
            if (data) return transformedData;
        } catch (e) {
            console.log(
                `An error occurred while fetching collection ${this.name}.`,
            );
            console.error(e.message);
            return;
        }
    }

    /**
     * Fetches entries of a collection from the provided cockpit content api.
     * If the query is specified it will filter out fields that do not match this query.
     * @param query Can be {} or a key-value map of the fields to match against.
     */
    async fetchEntries(query: Expression): Promise<T[]> {
        const data = await this.fetch();
        if (data) {
            return data.entries.filter((e) =>
                query ? matches(query, e) : true,
            );
        } else return [];
    }
}

export default CockpitStore;
