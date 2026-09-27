const ACTIVE_WORD_COUNT = 5;
const DROP_INTERVALS = [0, 4, 10, 22, 46];
const STORAGE_KEY = "lettering-word-progress-v1";
const MIN_REAPPEARANCE_FACTOR = 0.08;

function shuffle(values) {
    const copy = [...values];
    for (let index = copy.length - 1; index > 0; index -= 1) {
        const other = Math.floor(Math.random() * (index + 1));
        [copy[index], copy[other]] = [copy[other], copy[index]];
    }
    return copy;
}

function understandingFactor(successes = 0) {
    return Math.max(MIN_REAPPEARANCE_FACTOR, 0.92 ** (successes ** 2));
}

function shortWordShuffle(values, getSuccesses = () => 0, getBoost = () => 1) {
    const remaining = [...values];
    const result = [];
    while (remaining.length) {
        const weights = remaining.map(word =>
            Math.max(1, (10 - word.length) ** 2)
            * understandingFactor(getSuccesses(word))
            * getBoost(word)
        );
        let draw = Math.random() * weights.reduce((sum, weight) => sum + weight, 0);
        let index = 0;
        while (index < weights.length - 1 && draw >= weights[index]) draw -= weights[index++];
        result.push(remaining.splice(index, 1)[0]);
    }
    return result;
}

export function createWordCycle(dictionary, theme = "general", excludedWords = []) {
    const excluded = new Set(excludedWords);
    const candidates = dictionary
        .map(entry => entry.word)
        .filter(word => /^[A-Z]+$/.test(word) && word.length >= 3 && word.length <= 9 && !excluded.has(word));
    let saved = {};
    try { saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); } catch { /* Ignore unavailable storage. */ }
    const unique = [...new Set(candidates)];
    const shuffled = shortWordShuffle(
        unique,
        word => saved[`${theme}:${word}`]?.successes ?? 0,
        word => !saved[`${theme}:${word}`] ? 2
            : saved[`${theme}:${word}`].dueAt <= Date.now() ? 3 : 1
    );
    const selected = shuffled.slice(0, ACTIVE_WORD_COUNT);
    return {
        schemaVersion: 1,
        dropNumber: 0,
        activeWords: selected.map((word, index) => ({
            word, theme,
            level: Math.min(DROP_INTERVALS.length - 1, saved[`${theme}:${word}`]?.successes ?? 0),
            dueDrop: index, appearances: 0,
            successes: saved[`${theme}:${word}`]?.successes ?? 0
        }))
    };
}

function focusWord(cycle) {
    return [...cycle.activeWords].sort((a, b) =>
        Number(a.dueDrop > cycle.dropNumber) - Number(b.dueDrop > cycle.dropNumber)
        || a.dueDrop - b.dueDrop || a.level - b.level || a.appearances - b.appearances
    )[0];
}

function missingLetters(word, board) {
    const counts = new Map();
    board.flat().filter(Boolean).forEach(letter => counts.set(letter, (counts.get(letter) ?? 0) + 1));
    return [...word].filter(letter => {
        const count = counts.get(letter) ?? 0;
        if (!count) return true;
        counts.set(letter, count - 1);
        return false;
    });
}

export function createCycleLetterBatch(cycle, board, letterWeights, pickWeightedLetter) {
    const focus = focusWord(cycle);
    if (!focus) return [];
    const options = [];
    const pick = values => values[Math.floor(Math.random() * values.length)];
    const add = letter => { if (letter && !options.includes(letter)) options.push(letter); };
    add(pick(missingLetters(focus.word, board)));
    const others = cycle.activeWords.filter(item => item !== focus && item.dueDrop <= cycle.dropNumber);
    if (others.length) add(pick([...pick(others).word]));
    const available = [...new Set(cycle.activeWords.flatMap(item => [...item.word]))];
    add(pick(available));
    while (options.length < 4) {
        const candidates = available.filter(letter => !options.includes(letter));
        if (!candidates.length) break;
        add(pickWeightedLetter(candidates, letterWeights));
    }
    while (options.length < 4 && available.length) options.push(pick(available));
    const availableVowels = available.filter(letter => "AEIOU".includes(letter));
    if (!options.some(letter => "AEIOU".includes(letter)) && availableVowels.length) {
        options[options.length - 1] = pick(availableVowels);
    }
    focus.appearances += 1;
    cycle.dropNumber += 1;
    return shuffle(options);
}

export function registerWordSuccess(cycle, formedWord, dictionary) {
    const active = cycle.activeWords.find(item => item.word === formedWord);
    if (!active) return false;
    active.successes += 1;
    active.level = Math.min(DROP_INTERVALS.length - 1, active.successes);
    saveProgress(active);
    const saved = readProgress();
    const used = new Set(cycle.activeWords.map(item => item.word));
    const candidates = [...new Set(dictionary.map(entry => entry.word))].filter(word =>
        /^[A-Z]+$/.test(word) && word.length >= 3 && word.length <= 9 && !used.has(word)
    );
    const replacement = shortWordShuffle(
        candidates,
        word => saved[`${active.theme}:${word}`]?.successes ?? 0,
        word => !saved[`${active.theme}:${word}`] ? 2
            : saved[`${active.theme}:${word}`].dueAt <= Date.now() ? 3 : 1
    )[0];
    if (replacement) {
        const progress = saved[`${active.theme}:${replacement}`];
        Object.assign(active, {
            word: replacement,
            level: Math.min(DROP_INTERVALS.length - 1, progress?.successes ?? 0),
            dueDrop: Math.max(...cycle.activeWords.map(item => item.dueDrop)) + 1,
            appearances: 0,
            successes: progress?.successes ?? 0
        });
    }
    return true;
}

function readProgress() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); }
    catch { return {}; }
}

function saveProgress(item) {
    try {
        const saved = readProgress();
        const key = `${item.theme}:${item.word}`;
        const days = [0, 10 / 1440, 1, 3, 7][Math.min(4, item.successes)] ?? 7;
        saved[key] = { level: item.level, dueAt: Date.now() + days * 86400000,
            successes: item.successes };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
    } catch { /* Storage can be unavailable in private browsing. */ }
}
