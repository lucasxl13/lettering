import { requestApi } from "./apiClient.js";

export function getFlashcards() { return requestApi("/flashcards"); }
export function getFlashcardShop() { return requestApi("/flashcards/shop"); }
export function getFlashcardShopDeck(deckId) { return requestApi(`/flashcards/shop/${encodeURIComponent(deckId)}`); }
export function postFlashcardAction(input) {
    return requestApi("/flashcards/actions", { method: "POST", body: JSON.stringify(input) });
}
