import { t, getLanguage } from "../systems/language.js";
import { getSession } from "../systems/auth.js";
import { GENERAL_DECK_ID, MAX_CARDS, loadDecks, saveDecks, newCard, scheduleCard, dueCards } from "../systems/flashcards.js";

const escape = value => String(value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
const button = (action, label, extra = "") => `<button type="button" data-action="${action}" ${extra}>${label}</button>`;

export function loadFlashcards(onBack, initialView = "decks", initialDeckId = null) {
    const app = document.getElementById("app");
    // Mesma separação por usuário da futura API; nenhuma chamada de rede neste fluxo.
    const owner = getSession()?.user?.id;
    if (!owner) { onBack(); return; }
    let decks;
    try { decks = loadDecks(owner); }
    catch {
        app.innerHTML = `<main class="fc-screen"><h1>${t("flashcards_mode")}</h1><p role="alert">${t("fc_load_error")}</p>${button("back", t("back"))}</main>`;
        app.querySelector("button").onclick = onBack;
        return;
    }
    let view = initialView;
    let selectedId = initialDeckId;
    const openedDirectlyForStudy = initialView === "study" && Boolean(initialDeckId);
    let deckTab = "words";
    let deckPage = 0;
    let cardPage = 0;
    const drafts = new Map();
    const draftKey = () => `${selectedId}:${editingId ?? "new"}`;
    function pagination(page, total, target) {
        if (total < 2) return "";
        return `<nav class="fc-pagination" aria-label="${t("fc_pages")}">${button(`${target}-previous`, "←", `aria-label="${t("fc_previous")}" ${page === 0 ? "disabled" : ""}`)}<span aria-live="polite">${page + 1} / ${total}</span>${button(`${target}-next`, "→", `aria-label="${t("fc_next_page")}" ${page >= total - 1 ? "disabled" : ""}`)}</nav>`;
    }
    let editingId = null;
    let activeCardId = null;
    let manualReviewIds = null;
    let revealed = false;
    let reviewed = 0;
    const deckPageSize = () => window.innerWidth < 560 ? 1 : window.innerWidth < 900 ? 2 : 3;
    const cardPageSize = () => window.innerWidth < 700 ? 1 : 2;
    const currentDeck = () => selectedId === GENERAL_DECK_ID
        ? { id: GENERAL_DECK_ID, name: t("fc_general"), cards: decks.flatMap(deck => deck.cards) }
        : decks.find(deck => deck.id === selectedId);
    const date = timestamp => new Date(timestamp).toLocaleString(getLanguage(), { dateStyle: "short", timeStyle: "short" });
    const interval = card => card.intervalDays < 1
        ? `${Math.round(card.intervalDays * 1440)} ${t("fc_minutes")}`
        : `${card.intervalDays} ${t(card.intervalDays === 1 ? "fc_day" : "fc_days")}`;
    function error(message) { app.querySelector(".fc-error").textContent = message; }
    function commit(change) {
        const copy = structuredClone(decks);
        change(copy);
        try { saveDecks(owner, copy); decks = copy; return true; }
        catch { error(t("fc_save_error")); return false; }
    }
    function render() {
        const deck = currentDeck();
        let content;
        if (view === "statistics") {
            const cards = decks.flatMap(item => item.cards);
            content = `<h2>${t("statistics")}</h2><div class="fc-stats">
                ${[[decks.length, t("my_decks")], [cards.length, t("fc_cards")], [decks.reduce((sum, item) => sum + dueCards(item).length, 0), t("fc_due")], [cards.reduce((sum, card) => sum + card.reviews, 0), t("fc_reviews")]].map(([count, label]) => `<div><strong>${count}</strong><span>${label}</span></div>`).join("")}</div>`;
        } else if (view === "edit" && deck) {
            const editing = drafts.get(draftKey()) ?? deck.cards.find(card => card.id === editingId);
            const cardPages = Math.max(1, Math.ceil(deck.cards.length / cardPageSize()));
            cardPage = Math.max(0, Math.min(cardPage, cardPages - 1));
            content = `<div class="fc-heading"><h2>${escape(deck.name)}</h2><span>${deck.cards.length}/${MAX_CARDS} ${t("fc_cards")}</span></div>
                <nav class="fc-tabs fc-deck-tabs" aria-label="${t("fc_deck_sections")}">${[["words", "▦", "fc_cards"], ["add", "+", editingId ? "fc_edit_card" : "fc_add_card"], ["settings", "⚙", "fc_deck_settings"]].map(([tab, icon, key]) => button("deck-tab", `<span aria-hidden="true">${icon}</span>${t(key)}`, `data-tab="${tab}" aria-current="${deckTab === tab ? "page" : "false"}"`)).join("")}</nav>
                ${deckTab === "settings" ? `<form id="fc-rename" class="fc-inline"><label>${t("fc_deck_name")}<input name="name" required maxlength="60" value="${escape(deck.name)}"></label><button>${t("fc_rename")}</button></form><p class="fc-settings-note">${t("fc_local")}</p>` : ""}
                ${deckTab === "add" ? `<form id="fc-card-form" class="fc-panel"><h3>${t(editingId ? "fc_edit_card" : "fc_add_card")}</h3><div class="fc-fields">
                    <label>${t("fc_word")}<input name="word" required maxlength="80" value="${escape(editing?.word ?? "")}" ${!editingId && deck.cards.length >= MAX_CARDS ? "disabled" : ""}></label>
                    <label>${t("fc_translation")}<input name="translation" required maxlength="160" value="${escape(editing?.translation ?? "")}" ${!editingId && deck.cards.length >= MAX_CARDS ? "disabled" : ""}></label></div>
                    <div class="fc-actions"><button ${!editingId && deck.cards.length >= MAX_CARDS ? "disabled" : ""}>${t(editingId ? "fc_save" : "fc_add_card")}</button>${editingId ? button("cancel-edit", t("fc_cancel")) : ""}</div>
                    <p>${t(editingId ? "fc_edit_hint" : deck.cards.length >= MAX_CARDS ? "fc_limit" : "fc_limit_hint")}</p></form>` : ""}
                ${deckTab === "words" ? `<div class="fc-section-actions"><p>${t("fc_cards_hint")}</p>${deck.cards.length ? button("study", `▶ ${t("fc_study")}`, `data-id="${deck.id}" class="fc-primary"`) : ""}</div><ul class="fc-card-list">${deck.cards.slice(cardPage * cardPageSize(), (cardPage + 1) * cardPageSize()).map(card => `<li><div><strong>${escape(card.word)}</strong><span>${escape(card.translation)}</span><small>${card.reviews ? `${t("fc_next")}: ${date(card.dueAt)}` : t("fc_new")}</small></div><div class="fc-actions">${button("edit-card", t("fc_edit"), `data-id="${card.id}"`)}${button("delete-card", t("fc_remove"), `data-id="${card.id}"`)}</div></li>`).join("")}</ul>${pagination(cardPage, cardPages, "card")}
                ${deck.cards.length ? "" : `<section class="fc-empty"><h3>${t("fc_empty_title")}</h3><p>${t("fc_no_cards")}</p>${button("deck-tab", `+ ${t("fc_add_card")}`, 'data-tab="add" class="fc-primary"')}</section>`}` : ""}`;
        } else if (view === "study" && deck) {
            const due = dueCards(deck);
            const queuedCard = manualReviewIds
                ? deck.cards.find(item => item.id === manualReviewIds[0])
                : due[0];
            const card = deck.cards.find(item => item.id === activeCardId) ?? queuedCard;
            activeCardId = card?.id ?? null;
            const next = deck.cards.length ? Math.min(...deck.cards.map(item => item.dueAt)) : null;
            content = `<div class="fc-heading fc-study-heading"><div><h2>${escape(deck.name)}</h2><span>${reviewed} ${t(reviewed === 1 ? "fc_reviewed_one" : "fc_reviewed")} · ${due.length} ${t("fc_due")}</span></div>${card ? button("finish-study", t("fc_finish_review")) : ""}</div>`;
            if (card) {
                content += `<section class="fc-study-card"><small>${t("fc_word")}</small><h3>${escape(card.word)}</h3>${revealed ? `<div class="fc-answer"><small>${t("fc_translation")}</small><p>${escape(card.translation)}</p></div>` : `<p class="fc-hint">${t("fc_recall")}</p>`}</section>`;
                content += revealed ? `<p class="fc-rating-hint">${t("fc_rate_hint")}</p><div class="fc-ratings">${["again", "hard", "good", "easy"].map(rating => button("rate", `${t(`fc_${rating}`)}<small>${interval(scheduleCard(card, rating))}</small>`, `data-rating="${rating}"`)).join("")}</div>` : button("reveal", t("fc_reveal"), 'class="fc-primary"');
            } else content += `<section class="fc-complete"><div class="fc-complete-icon" aria-hidden="true">✓</div><span class="fc-complete-label">${t("fc_session_complete")}</span><h3>${deck.cards.length ? t("fc_done") : t("fc_general_empty")}</h3><p>${next ? `${t("fc_next")}: <strong>${date(next)}</strong>` : t("fc_general_empty_hint")}</p>${deck.cards.length ? `<div class="fc-complete-stats"><div><strong>${reviewed}</strong><span>${t("fc_reviewed_short")}</span></div><div><strong>${deck.cards.length}</strong><span>${t("fc_cards")}</span></div></div><div class="fc-complete-actions">${button("review-again", `↻ ${t("fc_review_again")}`, 'class="fc-primary"')}${button("finish-study", t("fc_finish_review"))}</div>` : `<div class="fc-complete-actions">${button("finish-study", t("back"), 'class="fc-primary"')}</div>`}</section>`;
        } else if (view === "create") {
            content = `<h2>${t("fc_create")}</h2><p>${t("fc_limit_hint")}</p><form id="fc-create" class="fc-panel fc-create-form"><label>${t("fc_deck_name")}<input name="name" required maxlength="60" placeholder="${t("fc_name_example")}" value="${escape(drafts.get("deck-name") ?? "")}"></label><button class="fc-primary">${t("fc_create")}</button></form>`;
        } else {
            view = "decks";
            const deckPages = Math.max(1, Math.ceil(decks.length / deckPageSize()));
            deckPage = Math.max(0, Math.min(deckPage, deckPages - 1));
            const totalDue = decks.reduce((sum, item) => sum + dueCards(item).length, 0);
            content = `<div class="fc-dashboard"><div><span>${t("fc_decks_count")}</span><strong>${decks.length}</strong></div><div><span>${t("fc_due_now")}</span><strong>${totalDue}</strong></div><div><span>${t("fc_total_words")}</span><strong>${decks.reduce((sum, item) => sum + item.cards.length, 0)}</strong></div></div>
                <div class="fc-heading"><div><h2>${t("my_decks")}</h2><p>${t("fc_choose_deck")}</p></div></div>
                <div class="fc-decks">${decks.slice(deckPage * deckPageSize(), (deckPage + 1) * deckPageSize()).map((item, index) => `<article class="fc-panel fc-deck-card"><div class="fc-deck-top"><span class="fc-deck-number">${String(deckPage * deckPageSize() + index + 1).padStart(2, "0")}</span><span class="fc-due-pill">${dueCards(item).length} ${t("fc_due")}</span></div><h3>${escape(item.name)}</h3><div class="fc-progress" aria-label="${item.cards.length}/${MAX_CARDS} ${t("fc_cards")}"><span style="width:${item.cards.length / MAX_CARDS * 100}%"></span></div><p>${item.cards.length}/${MAX_CARDS} ${t("fc_cards")}</p><div class="fc-actions">${button("study", `▶ ${t("fc_study")}`, `data-id="${escape(item.id)}" class="fc-primary" ${item.cards.length ? "" : "disabled"}`)}${button("open-deck", t("fc_manage"), `data-id="${escape(item.id)}"`)}${button("delete-deck", "×", `data-id="${escape(item.id)}" class="fc-icon-danger" aria-label="${t("fc_remove")}"`)}</div></article>`).join("") || `<section class="fc-empty fc-empty-decks"><div class="fc-empty-icon">▦</div><h3>${t("fc_empty_decks_title")}</h3><p>${t("fc_no_decks")}</p></section>`}</div>${pagination(deckPage, deckPages, "deck")}`;
        }
        const inDeck = (view === "edit" || view === "study") && deck;
        app.innerHTML = `<main class="fc-screen"><header class="fc-header">${button("back", "←", `aria-label="${t("back")}"`)}<h1>${t("flashcards_mode")}</h1><span class="fc-header-spacer" aria-hidden="true"></span></header>
            ${inDeck ? "" : `<nav class="fc-tabs fc-main-tabs" aria-label="${t("flashcards_mode")}">${[["decks", "▦", "my_decks"], ["create", "+", "fc_create"], ["statistics", "↗", "statistics"]].map(([tab, icon, key]) => button(tab, `<span aria-hidden="true">${icon}</span>${t(key)}`, `aria-current="${view === tab ? "page" : "false"}"`)).join("")}</nav>`}
            <div class="fc-error" role="alert"></div><section class="fc-content fc-view-${view}" aria-label="${t("flashcards_mode")}">${content}</section></main>`;
        app.querySelectorAll("[data-action]").forEach(element => element.addEventListener("click", () => action(element.dataset)));
        app.querySelector("#fc-create")?.addEventListener("submit", event => {
            event.preventDefault();
            const name = event.target.elements.name.value.trim();
            if (!name) return error(t("fc_required"));
            const id = crypto.randomUUID();
            if (commit(copy => copy.push({ id, name, cards: [] }))) { selectedId = id; deckTab = "add"; editingId = null; cardPage = 0; drafts.delete("deck-name"); view = "edit"; render(); }
        });
        app.querySelector("#fc-rename")?.addEventListener("submit", event => {
            event.preventDefault();
            const name = event.target.elements.name.value.trim();
            if (!name) return error(t("fc_required"));
            if (commit(copy => copy.find(item => item.id === selectedId).name = name)) render();
        });
        app.querySelector("#fc-card-form")?.addEventListener("submit", event => {
            event.preventDefault();
            const word = event.target.elements.word.value.trim();
            const translation = event.target.elements.translation.value.trim();
            if (!word || !translation) return error(t("fc_required"));
            if (!editingId && deck.cards.length >= MAX_CARDS) return error(t("fc_limit"));
            if (deck.cards.some(card => card.id !== editingId && card.word.normalize("NFKC").toLowerCase() === word.normalize("NFKC").toLowerCase())) return error(t("fc_duplicate"));
            if (commit(copy => {
                const target = copy.find(item => item.id === selectedId);
                if (editingId) {
                    const index = target.cards.findIndex(card => card.id === editingId);
                    const old = target.cards[index];
                    if (old.word !== word || old.translation !== translation) target.cards[index] = { ...newCard(word, translation), id: old.id };
                } else target.cards.push(newCard(word, translation));
            })) {
                drafts.delete(draftKey());
                const wasEditing = Boolean(editingId);
                editingId = null;
                if (wasEditing) deckTab = "words";
                else if (currentDeck().cards.length === MAX_CARDS) { deckTab = "words"; cardPage = MAX_CARDS - 1; }
                render();
                app.querySelector('[name="word"]')?.focus();
            }
        });
    }
    function action({ action, id, rating, tab }) {
        if (action === "finish-study") return onBack();
        const form = app.querySelector("#fc-card-form");
        if (form) drafts.set(draftKey(), { word: form.elements.word.value, translation: form.elements.translation.value });
        const createForm = app.querySelector("#fc-create");
        if (createForm) drafts.set("deck-name", createForm.elements.name.value);
        if (action === "deck-tab") deckTab = tab;
        if (action === "deck-previous") deckPage -= 1;
        if (action === "deck-next") deckPage += 1;
        if (action === "card-previous") cardPage -= 1;
        if (action === "card-next") cardPage += 1;
        if (action === "back") { if (view === "decks" || openedDirectlyForStudy) return onBack(); view = "decks"; editingId = null; }
        if (["decks", "statistics", "create"].includes(action)) view = action;
        if (action === "open-deck") { selectedId = id; editingId = null; deckTab = "words"; cardPage = 0; view = "edit"; }
        if (action === "study") { selectedId = id; activeCardId = null; manualReviewIds = null; revealed = false; reviewed = 0; view = "study"; }
        if (action === "reveal") revealed = true;
        if (action === "refresh") activeCardId = null;
        if (action === "review-again") {
            manualReviewIds = currentDeck().cards.map(card => card.id);
            activeCardId = null;
            revealed = false;
            reviewed = 0;
        }
        if (action === "edit-card") { editingId = id; deckTab = "add"; }
        if (action === "cancel-edit") { drafts.delete(draftKey()); editingId = null; deckTab = "words"; }
        if (action === "delete-deck") {
            if (!window.confirm(t("fc_delete_deck"))) return;
            if (!commit(copy => copy.splice(copy.findIndex(deck => deck.id === id), 1))) return;
        }
        if (action === "delete-card") {
            if (!window.confirm(t("fc_delete_card"))) return;
            if (!commit(copy => { const cards = copy.find(deck => deck.id === selectedId).cards; cards.splice(cards.findIndex(card => card.id === id), 1); })) return;
            if (editingId === id) editingId = null;
        }
        if (action === "rate") {
            if (!revealed || !activeCardId) return;
            if (!commit(copy => {
                const sourceDeck = selectedId === GENERAL_DECK_ID
                    ? copy.find(deck => deck.cards.some(card => card.id === activeCardId))
                    : copy.find(deck => deck.id === selectedId);
                const index = sourceDeck?.cards.findIndex(card => card.id === activeCardId) ?? -1;
                if (index >= 0) sourceDeck.cards[index] = scheduleCard(sourceDeck.cards[index], rating);
            })) return;
            if (manualReviewIds) manualReviewIds = manualReviewIds.filter(id => id !== activeCardId);
            activeCardId = null; revealed = false; reviewed += 1;
        }
        render();
        if (action === "edit-card") app.querySelector('[name="word"]').focus();
    }
    render();
}
