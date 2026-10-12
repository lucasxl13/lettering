import assert from "node:assert/strict";
import test from "node:test";
import { toRomanLevel } from "../script/systems/progression-format.js";

test("formats progression levels as Roman numerals", () => {
    assert.equal(toRomanLevel(1), "I");
    assert.equal(toRomanLevel(3), "III");
    assert.equal(toRomanLevel(4), "IV");
    assert.equal(toRomanLevel(9), "IX");
    assert.equal(toRomanLevel(42), "XLII");
    assert.equal(toRomanLevel(100), "C");
});

test("normalizes invalid progression levels to level one", () => {
    assert.equal(toRomanLevel(0), "I");
    assert.equal(toRomanLevel(undefined), "I");
});
