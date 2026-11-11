import assert from "node:assert/strict";
import test from "node:test";

globalThis.window = {
    location: { hostname: "localhost" },
    localStorage: { getItem() { return null; } }
};

const { getTourStorageKey, hasCompletedTour, shouldShowTour } = await import("../script/systems/tour-guide.js");

function storageWith(entries = []) {
    const values = new Map(entries);
    return {
        getItem(key) { return values.get(key) ?? null; },
        setItem(key, value) { values.set(key, value); }
    };
}

test("tour completion is stored separately for each authenticated user", () => {
    const storage = storageWith([[getTourStorageKey("user one"), "complete"]]);

    assert.equal(hasCompletedTour("user one", storage), true);
    assert.equal(hasCompletedTour("user two", storage), false);
    assert.notEqual(getTourStorageKey("user one"), getTourStorageKey("user two"));
});

test("automatic tour only appears for an authenticated user who has not completed it", () => {
    const storage = storageWith();
    const session = { user: { id: "player-1" } };

    assert.equal(shouldShowTour(session, storage), true);
    storage.setItem(getTourStorageKey("player-1"), "complete");
    assert.equal(shouldShowTour(session, storage), false);
    assert.equal(shouldShowTour(null, storage), false);
});

test("screen tours keep independent completion state", () => {
    const storage = storageWith();
    const session = { user: { id: "player-1" } };

    storage.setItem(getTourStorageKey("player-1", "modes"), "complete");

    assert.equal(shouldShowTour(session, storage, "modes"), false);
    assert.equal(shouldShowTour(session, storage, "game"), true);
    assert.notEqual(
        getTourStorageKey("player-1", "modes"),
        getTourStorageKey("player-1", "game")
    );
});

test("guests receive mode and game help without receiving account onboarding", () => {
    const storage = storageWith();

    assert.equal(shouldShowTour(null, storage, "menu"), false);
    assert.equal(shouldShowTour(null, storage, "modes"), true);
    assert.equal(shouldShowTour(null, storage, "game"), true);
});
