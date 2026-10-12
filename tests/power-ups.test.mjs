import assert from "node:assert/strict";
import test from "node:test";
import {
    applyPowerToBoard,
    COMBO_WINDOW_MS,
    createGameplayState,
    registerCombo,
    registerTargetWord,
    releasePendingPower
} from "../script/systems/power-ups.js";

test("awards one power every five target words using 30/30/30/10 boundaries", () => {
    const draws = [0, .3, .6, .9];
    const expected = ["clearRow", "clearColumn", "clearLetter", "clearAll"];
    draws.forEach((draw, drawIndex) => {
        const state = createGameplayState();
        for (let count = 0; count < 4; count += 1) {
            assert.equal(registerTargetWord(state, draw), null);
        }
        assert.equal(registerTargetWord(state, draw), expected[drawIndex]);
        assert.equal(state.powers[expected[drawIndex]], 1);
        assert.equal(state.targetWordsTowardPower, 0);
    });
});

test("holds a completed second cycle until a stored power is used", () => {
    const state = createGameplayState();
    for (let count = 0; count < 5; count += 1) registerTargetWord(state, 0);
    assert.equal(state.powers.clearRow, 1);

    for (let count = 0; count < 5; count += 1) registerTargetWord(state, .4);
    assert.equal(state.targetWordsTowardPower, 5);
    assert.equal(state.powers.clearColumn, 0);
    assert.equal(registerTargetWord(state, .4), null);
    assert.equal(state.targetWordsTowardPower, 5);

    state.powers.clearRow -= 1;
    assert.equal(releasePendingPower(state, .4), "clearColumn");
    assert.equal(state.targetWordsTowardPower, 0);
    assert.equal(state.powers.clearColumn, 1);
});

test("combo grows inside twenty seconds, caps at 8x and resets outside the window", () => {
    const state = createGameplayState();
    assert.equal(registerCombo(state, 1_000), 1);
    for (let multiplier = 2; multiplier <= 8; multiplier += 1) {
        assert.equal(registerCombo(state, multiplier * 1_000), multiplier);
    }
    assert.equal(registerCombo(state, 9_000), 8);
    assert.equal(registerCombo(state, 9_000 + COMBO_WINDOW_MS), 8);
    assert.equal(registerCombo(state, 9_000 + COMBO_WINDOW_MS * 2 + 1), 1);
});

test("clear-letter removes the most frequent letter and compacts the board", () => {
    const board = [
        [null, "B", null],
        ["A", "B", null],
        ["A", "C", "B"]
    ];
    const result = applyPowerToBoard(board, "clearLetter");
    assert.equal(result.clearedLetter, "B");
    assert.equal(result.removed, 3);
    assert.deepEqual(board, [
        [null, null, null],
        ["A", null, null],
        ["A", "C", null]
    ]);
});

test("row and column powers remove the fullest line, favoring the lowest index on ties", () => {
    const rowBoard = [[null, null, null], ["A", "B", null], ["C", "D", null]];
    assert.equal(applyPowerToBoard(rowBoard, "clearRow").removed, 2);
    assert.deepEqual(rowBoard, [[null, null, null], [null, null, null], ["C", "D", null]]);

    const columnBoard = [["A", "B", null], ["C", "D", "E"]];
    assert.equal(applyPowerToBoard(columnBoard, "clearColumn").removed, 2);
    assert.deepEqual(columnBoard, [[null, "B", null], [null, "D", "E"]]);

    assert.equal(applyPowerToBoard(columnBoard, "clearAll").removed, 3);
    assert.deepEqual(columnBoard, [[null, null, null], [null, null, null]]);
});
