export const MAX_CARDS = 20;
export const GENERAL_DECK_ID = "__general__";
const DAY = 86400000;

// Scheduling previews only; persistence is handled by flashcardsApi.js.
export function newCard(word, translation) {
    return { id: crypto.randomUUID(), word: word.trim(), translation: translation.trim(),
        dueAt: 0, intervalDays: 0, ease: 2.5, reviews: 0, lapses: 0, lastReviewedAt: null };
}

// Revisão espaçada simples inspirada em SM-2, não o FSRS do Anki.
// Again: 1 min; Hard: 10 min durante aprendizado; Good: 1 dia; Easy: 4 dias.
// Depois, dificuldade reduz/cresce o intervalo e ease; erros voltam a aprender.
// TODO(PEDRAO/CODEX): preservar esta regra ou versionar o algoritmo ao migrar.
export function scheduleCard(card, rating, now = Date.now()) {
    if (!["again", "hard", "good", "easy"].includes(rating)) throw new Error("Invalid rating");
    let ease = card.ease;
    let intervalDays;
    if (rating === "again") { intervalDays = 1 / 1440; ease = Math.max(1.3, ease - 0.2); }
    if (rating === "hard") { intervalDays = card.intervalDays < 1 ? 10 / 1440 : Math.max(card.intervalDays + 1, Math.round(card.intervalDays * 1.2)); ease = Math.max(1.3, ease - 0.15); }
    if (rating === "good") intervalDays = card.intervalDays < 1 ? 1 : Math.max(card.intervalDays + 1, Math.round(card.intervalDays * ease));
    if (rating === "easy") { intervalDays = card.intervalDays < 1 ? 4 : Math.max(card.intervalDays + 2, Math.ceil(card.intervalDays * ease * 1.3)); ease = Math.min(3.5, ease + 0.15); }
    intervalDays = Math.min(36500, intervalDays);
    return { ...card, ease, intervalDays, dueAt: now + Math.round(intervalDays * DAY),
        reviews: card.reviews + 1, lapses: card.lapses + Number(rating === "again"), lastReviewedAt: now };
}

export function dueCards(deck, now = Date.now()) {
    return deck.cards.filter(card => card.dueAt <= now).sort((a, b) =>
        Number(a.reviews === 0) - Number(b.reviews === 0) || a.dueAt - b.dueAt);
}
