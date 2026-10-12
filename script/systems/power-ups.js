export const POWER_TYPES = ["clearRow", "clearColumn", "clearLetter", "clearAll"];
export const COMBO_WINDOW_MS = 20_000;

export function createGameplayState(source = {}) {
    const sourcePowers = source.powers ?? {};
    const count = value => Math.max(0, Math.floor(Number(value) || 0));
    return {
        powers: Object.fromEntries(POWER_TYPES.map(type => [type, count(sourcePowers[type])])),
        targetWordsTowardPower: Math.min(5, count(source.targetWordsTowardPower)),
        comboMultiplier: Math.min(8, count(source.comboMultiplier)),
        lastWordAt: null
    };
}

export function registerCombo(state, now = Date.now()) {
    const inWindow = state.lastWordAt !== null && now - state.lastWordAt <= COMBO_WINDOW_MS;
    state.comboMultiplier = inWindow ? Math.min(8, state.comboMultiplier + 1) : 1;
    state.lastWordAt = now;
    return state.comboMultiplier;
}

export function registerTargetWord(state, randomValue = Math.random()) {
    if (state.targetWordsTowardPower >= 5) return null;
    state.targetWordsTowardPower += 1;
    if (state.targetWordsTowardPower < 5) return null;
    if (Object.values(state.powers).some(count => count > 0)) return null;
    return awardRandomPower(state, randomValue);
}

export function releasePendingPower(state, randomValue = Math.random()) {
    if (state.targetWordsTowardPower < 5) return null;
    return awardRandomPower(state, randomValue);
}

function awardRandomPower(state, randomValue) {
    state.targetWordsTowardPower = 0;
    const type = randomValue < .3 ? "clearRow"
        : randomValue < .6 ? "clearColumn"
            : randomValue < .9 ? "clearLetter" : "clearAll";
    state.powers[type] += 1;
    return type;
}

function fullestIndex(counts) {
    let bestIndex = null;
    let bestCount = 0;
    counts.forEach((count, index) => {
        if (count > bestCount) {
            bestCount = count;
            bestIndex = index;
        }
    });
    return bestIndex;
}

function mostFrequentLetter(board) {
    const counts = new Map();
    board.flat().filter(Boolean).forEach(letter => {
        counts.set(letter, (counts.get(letter) ?? 0) + 1);
    });
    return [...counts.entries()]
        .sort(([letterA, countA], [letterB, countB]) => countB - countA
            || letterA.localeCompare(letterB))[0]?.[0] ?? null;
}

export function applyPowerToBoard(board, type) {
    const columnCount = Math.max(0, ...board.map(row => row.length));
    const targetIndex = type === "clearRow"
        ? fullestIndex(board.map(row => row.filter(Boolean).length))
        : type === "clearColumn"
            ? fullestIndex(Array.from({ length: columnCount }, (_, column) =>
                board.reduce((count, row) => count + Number(Boolean(row[column])), 0)))
            : null;
    const clearedLetter = type === "clearLetter" ? mostFrequentLetter(board) : null;
    let removed = 0;
    board.forEach((row, rowIndex) => row.forEach((letter, columnIndex) => {
        const shouldClear = Boolean(letter) && (
            type === "clearAll"
            || (type === "clearRow" && rowIndex === targetIndex)
            || (type === "clearColumn" && columnIndex === targetIndex)
            || (type === "clearLetter" && letter === clearedLetter)
        );
        if (shouldClear) {
            board[rowIndex][columnIndex] = null;
            removed += 1;
        }
    }));
    if (!removed) return { used: false, removed: 0, clearedLetter };
    for (let column = 0; column < columnCount; column += 1) {
        const remaining = board.map(row => row[column]).filter(Boolean);
        const emptyCount = board.length - remaining.length;
        board.forEach((row, rowIndex) => {
            row[column] = rowIndex < emptyCount ? null : remaining[rowIndex - emptyCount];
        });
    }
    return { used: true, removed, clearedLetter };
}
