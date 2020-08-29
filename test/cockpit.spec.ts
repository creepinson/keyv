import { assert, expect } from "chai";
import { CockpitStore } from "../packages/store-cockpit-cms/src/index";
import "mocha";
import dotenv from "dotenv";

dotenv.config();

describe("Cockpit store", () => {
    it("should have more than one collection object", async () => {
        const store = new CockpitStore({
            apiToken: process.env.TOKEN,
            apiBaseUrl: "https://cockpit.theoparis.com",
        });
        const result = await store
            .col(process.env.COLLECTION || "project")
            .fetchEntries({});
        assert(result.length && result.length > 0);
    });
});
