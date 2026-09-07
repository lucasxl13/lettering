import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
const source = readFileSync(new URL('../script/systems/flashcards.js', import.meta.url), 'utf8');
const { newCard, scheduleCard, dueCards, loadDecks, saveDecks } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);

test('ratings schedule different intervals; errors return sooner and successful reviews grow', () => {
    const card = newCard('house', 'casa');
    const now = 1000000;
    const ratings = ['again', 'hard', 'good', 'easy'].map(rating => scheduleCard(card, rating, now));
    assert.deepEqual(ratings.map(item => item.dueAt - now), [60000, 600000, 86400000, 345600000]);
    const good = ratings[2];
    assert.ok(scheduleCard(good, 'good', now).intervalDays > good.intervalDays);
    assert.equal(scheduleCard(good, 'again', now).lapses, 1);
    assert.equal(card.reviews, 0);
    let failed = good;
    for (let i = 0; i < 30; i++) failed = scheduleCard(failed, 'again', now);
    assert.equal(failed.ease, 1.3);
    assert.throws(() => scheduleCard(card, 'invalid'));
});

test('due reviews precede new cards; future cards only return when due', () => {
    const now = 1000000;
    const fresh = newCard('bird', 'pássaro');
    const failed = scheduleCard(newCard('house', 'casa'), 'again', now);
    const deck = { cards: [fresh, failed] };
    assert.deepEqual(dueCards(deck, now), [fresh]);
    assert.deepEqual(dueCards(deck, now + 60000), [failed, fresh]);
});

test('storage survives reload, separates users and refuses corrupt/over-limit data', () => {
    const data = new Map();
    globalThis.localStorage = { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) };
    const decks = [{ id: 'test', name: 'Teste', cards: [newCard('house', 'casa')] }];
    saveDecks('one', decks);
    assert.deepEqual(loadDecks('one'), decks);
    assert.deepEqual(loadDecks('two'), []);
    data.set('lettering-flashcards-v1:one', '{broken');
    assert.throws(() => loadDecks('one'));
    decks[0].cards = Array.from({ length: 21 }, () => newCard('word', 'tradução'));
    saveDecks('one', decks);
    assert.throws(() => loadDecks('one'));
});
