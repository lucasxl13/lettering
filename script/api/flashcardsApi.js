import { requestApi } from "./apiClient.js";

export function getFlashcards() { return requestApi("/flashcards"); }
export function postFlashcardAction(input) {
    return requestApi("/flashcards/actions", { method: "POST", body: JSON.stringify(input) });
}
