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

const dictionary = ['CHAIR', 'TABLE', 'PHONE', 'LAMP', 'CUP', 'PEN', 'BOTTLE', 'WINDOW']
    .map(word => ({ word }));
const weights = new Map([...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'].map(letter => [letter, 1]));

test('guest word cycle keeps three words and rotates a successful word', () => {
    const cycle = cycleModule.createWordCycle(dictionary, 'objects');
    assert.equal(cycle.activeWords.length, 3);
    const target = cycle.activeWords[0].word;
    const batch = cycleModule.createCycleLetterBatch(
        cycle, [], weights, candidates => candidates[0]
    );
    assert.equal(batch.length, 4);
    assert.equal(new Set(batch).size, 4);
    assert.ok(batch.some(letter => 'AEIOU'.includes(letter)));
    assert.equal(cycleModule.registerWordSuccess(cycle, target, dictionary), true);
    assert.equal(cycle.activeWords.some(item => item.word === target), false);
    assert.equal(cycle.activeWords.length, 3);
    assert.ok(saved.has('lettering-word-progress-v1'));
    const progress = JSON.parse(saved.get('lettering-word-progress-v1'));
    assert.equal(progress[`objects:${target}`].successes, 1);
});

test('each batch uses two displayed words and two random unique letters', () => {
    const cycle = cycleModule.createWordCycle(
        ['ACE', 'DEER', 'SPIDER'].map(word => ({ word })), 'objects'
    );
    const batch = cycleModule.createCycleLetterBatch(
        cycle, [], weights, candidates => candidates[0]
    );
    const selectedWords = cycle.activeWords.filter(item => item.appearances === 1);

    assert.equal(selectedWords.length, 2);
    assert.ok(selectedWords.every(item => [...item.word].some(letter => batch.includes(letter))));
    assert.equal(batch.length, 4);
    assert.equal(new Set(batch).size, 4);
    assert.ok(batch.some(letter => 'AEIOU'.includes(letter)));
});

test('reset can exclude all three previous words', () => {
    const extended = [...dictionary, ...['BOX', 'BAG', 'KEY', 'MAP', 'CAR'].map(word => ({ word }))];
    const first = cycleModule.createWordCycle(extended, 'objects');
    const previous = first.activeWords.map(item => item.word);
    const reset = cycleModule.createWordCycle(extended, 'objects', previous);
    assert.equal(reset.activeWords.length, 3);
    assert.ok(reset.activeWords.every(item => !previous.includes(item.word)));
});

test('uses knowledge groups and removes words after 25 successes', () => {
    assert.deepEqual(
        [0, 1, 4, 5, 9, 10, 14, 15, 19, 20, 24, 25].map(cycleModule.getKnowledgeLevel),
        [0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6]
    );
    assert.deepEqual(
        [0, 1, 5, 10, 15, 20, 25].map(cycleModule.getKnowledgeWeight),
        [100, 55, 30, 16, 8, 3, 0]
    );

    saved.set('lettering-word-progress-v1', JSON.stringify({
        'objects:CHAIR': { successes: 25, level: 6, dueAt: 0 }
    }));
    const cycle = cycleModule.createWordCycle(dictionary, 'objects');
    assert.equal(cycle.activeWords.some(item => item.word === 'CHAIR'), false);
    saved.clear();
});
