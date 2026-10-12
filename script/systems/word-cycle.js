const ACTIVE_WORD_COUNT = 3;
const DROP_INTERVALS = [0, 4, 10, 22, 46, 70, 100];
export const KNOWLEDGE_THRESHOLDS = [0, 1, 5, 10, 15, 20, 25];
export const KNOWLEDGE_WEIGHTS = [100, 55, 30, 16, 8, 3, 0];
const STORAGE_KEY = "lettering-word-progress-v1";
const WORD_MASTERY_LEVEL = KNOWLEDGE_THRESHOLDS.length - 1;

export function getKnowledgeLevel(successes) {
    const safeSuccesses = Math.max(0, Math.floor(Number(successes) || 0));
    let level = 0;
    for (let index = 1; index < KNOWLEDGE_THRESHOLDS.length; index += 1) {
        if (safeSuccesses < KNOWLEDGE_THRESHOLDS[index]) break;
        level = index;
    }
    return level;
}

function shuffle(values) {
    const copy = [...values];
    for (let index = copy.length - 1; index > 0; index -= 1) {
        const other = Math.floor(Math.random() * (index + 1));
        [copy[index], copy[other]] = [copy[other], copy[index]];
    }
    return copy;
}

export function getKnowledgeWeight(successes) {
    return KNOWLEDGE_WEIGHTS[getKnowledgeLevel(successes)];
}

function knowledgeShuffle(values, getSuccesses = () => 0) {
    const remaining = [...values];
    const result = [];
    while (remaining.length) {
        const weights = remaining.map(word => getKnowledgeWeight(getSuccesses(word)));
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
    const eligible = unique.filter(word =>
        getKnowledgeWeight(saved[`${theme}:${word}`]?.successes ?? 0) > 0
    );
    const shuffled = knowledgeShuffle(
        eligible,
        word => saved[`${theme}:${word}`]?.successes ?? 0
    );
    const selected = shuffled.slice(0, ACTIVE_WORD_COUNT);
    return {
        schemaVersion: 1,
        dropNumber: 0,
        activeWords: selected.map((word, index) => ({
            word, theme,
            level: getKnowledgeLevel(saved[`${theme}:${word}`]?.successes ?? 0),
            dueDrop: index, appearances: 0,
            successes: saved[`${theme}:${word}`]?.successes ?? 0
        }))
    };
}

export function createCycleLetterBatch(cycle, _board, letterWeights, pickWeightedLetter) {
    if (!cycle.activeWords.length) return [];
    const options = [];
    const add = letter => { if (letter && !options.includes(letter)) options.push(letter); };
    const availableLetters = [...letterWeights.keys()];
    const addRandom = (vowelOnly = false) => {
        const candidates = availableLetters.filter(letter =>
            !options.includes(letter) && (!vowelOnly || "AEIOU".includes(letter))
        );
        if (!candidates.length) return;
        add(pickWeightedLetter(candidates, letterWeights));
    };

    const availableWords = [...cycle.activeWords];
    const selectedWords = [];
    while (selectedWords.length < 2 && availableWords.length) {
        const index = Math.floor(Math.random() * availableWords.length);
        selectedWords.push(availableWords.splice(index, 1)[0]);
    }
    selectedWords.forEach(item => {
        const candidates = [...new Set(item.word)].filter(letter => !options.includes(letter));
        if (candidates.length) {
            add(candidates[Math.floor(Math.random() * candidates.length)]);
        }
        item.appearances += 1;
    });
    while (options.length < 3) addRandom(!options.some(letter => "AEIOU".includes(letter)));
    while (options.length < 4) addRandom(!options.some(letter => "AEIOU".includes(letter)));

    cycle.dropNumber += 1;
    return shuffle(options);
}

export function registerWordSuccess(cycle, formedWord, dictionary) {
    const active = cycle.activeWords.find(item => item.word === formedWord);
    if (!active) return false;
    active.successes += 1;
    active.level = getKnowledgeLevel(active.successes);
    saveProgress(active);
    const saved = readProgress();
    const used = new Set(cycle.activeWords.map(item => item.word));
    const unique = [...new Set(dictionary.map(entry => entry.word))];
    const candidates = unique.filter(word =>
        /^[A-Z]+$/.test(word) && word.length >= 3
        && word.length <= 9 && !used.has(word)
        && getKnowledgeWeight(saved[`${active.theme}:${word}`]?.successes ?? 0) > 0
    );
    const replacement = knowledgeShuffle(
        candidates,
        word => saved[`${active.theme}:${word}`]?.successes ?? 0
    )[0];
    if (replacement) {
        const progress = saved[`${active.theme}:${replacement}`];
        Object.assign(active, {
            word: replacement,
            level: getKnowledgeLevel(progress?.successes ?? 0),
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
