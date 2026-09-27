import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const saved = new Map();
globalThis.localStorage = {
    getItem: key => saved.get(key) ?? null,
    setItem: (key, value) => saved.set(key, value)
};
const source = readFileSync(new URL('../script/systems/word-cycle.js', import.meta.url), 'utf8');
const cycleModule = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);

const dictionary = ['CHAIR', 'TABLE', 'PHONE', 'BOTTLE', 'WINDOW', 'LAMP']
    .map(word => ({ word }));
const weights = new Map([...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'].map(letter => [letter, 1]));

test('guest word cycle keeps five words and rotates a successful word', () => {
    const cycle = cycleModule.createWordCycle(dictionary, 'objects');
    assert.equal(cycle.activeWords.length, 5);
    const target = cycle.activeWords[0].word;
    const batch = cycleModule.createCycleLetterBatch(
        cycle, [], weights, candidates => candidates[0]
    );
    assert.equal(batch.length, 4);
    assert.equal(new Set(batch).size, 4);
    assert.ok(batch.some(letter => 'AEIOU'.includes(letter)));
    assert.equal(cycleModule.registerWordSuccess(cycle, target, dictionary), true);
    assert.equal(cycle.activeWords.some(item => item.word === target), false);
    assert.equal(cycle.activeWords.length, 5);
    assert.ok(saved.has('lettering-word-progress-v1'));
    const progress = JSON.parse(saved.get('lettering-word-progress-v1'));
    assert.equal(progress[`objects:${target}`].successes, 1);
});

test('cycle choices only use letters from its five words', () => {
    const cycle = cycleModule.createWordCycle(dictionary, 'objects');
    const allowed = new Set(cycle.activeWords.flatMap(item => [...item.word]));
    const batch = cycleModule.createCycleLetterBatch(cycle, [], weights, candidates => candidates[0]);
    assert.ok(batch.every(letter => allowed.has(letter)));
});

test('reset can exclude all five previous words', () => {
    const extended = [...dictionary, ...['CUP', 'PEN', 'BOX', 'BAG', 'KEY'].map(word => ({ word }))];
    const first = cycleModule.createWordCycle(extended, 'objects');
    const previous = first.activeWords.map(item => item.word);
    const reset = cycleModule.createWordCycle(extended, 'objects', previous);
    assert.equal(reset.activeWords.length, 5);
    assert.ok(reset.activeWords.every(item => !previous.includes(item.word)));
});
