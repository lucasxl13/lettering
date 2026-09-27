import { readFileSync, writeFileSync } from 'node:fs';

const frontendPath = new URL('../script/data/words.json', import.meta.url);
const backendPath = new URL('../../lettering-backend/data/english/words.json', import.meta.url);
const source = JSON.parse(readFileSync(frontendPath, 'utf8'));
const themeOrder = ['verbs', 'nouns', 'adjectives', 'objects', 'animals', 'food', 'nature'];
const words = new Map();

for (const theme of themeOrder) {
    for (const entry of source.general?.[theme]?.words ?? []) {
        let canonical = words.get(entry.word);
        if (!canonical) {
            canonical = {
                word: entry.word,
                translations: { 'pt-BR': [], 'es-ES': [] },
                score: entry.score,
                themes: [],
            };
            words.set(entry.word, canonical);
        }
        for (const locale of ['pt-BR', 'es-ES']) {
            canonical.translations[locale] = [...new Set([
                ...canonical.translations[locale], ...entry.translations[locale],
            ])];
        }
        canonical.score = Math.max(canonical.score, entry.score);
        canonical.themes.push(theme);
    }
}

const output = `${JSON.stringify({
    schemaVersion: 2,
    language: 'en-US',
    themes: themeOrder,
    words: [...words.values()].sort((a, b) => a.word.localeCompare(b.word, 'en')),
}, null, 2)}\n`;

writeFileSync(frontendPath, output);
writeFileSync(backendPath, output);
console.log(`Wrote ${words.size} unique words.`);
