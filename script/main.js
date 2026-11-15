import { loadLanguage } from "./systems/language.js";
import { loadTheme } from "./systems/theme.js";
import { loadMenu } from "./screens/menu.js";
import { checkSession, getSession } from "./systems/auth.js";
import { getRoute } from "./systems/router.js";
import { loadModes } from "./screens/modes.js";
import { loadClassic } from "./screens/classic.js";
import { loadVersus } from "./screens/versus.js";
import { loadFlashcards } from "./screens/flashcards.js";
import { installAudio } from "./systems/audio-player.js";
import "./systems/pwa-install.js";

const isEditableTarget = target => target instanceof Element
    && Boolean(target.closest("input, textarea, [contenteditable='true']"));

["selectstart", "copy", "cut", "contextmenu", "dragstart"].forEach(eventName => {
    document.addEventListener(eventName, event => {
        if (!isEditableTarget(event.target)) event.preventDefault();
    });
});

loadTheme();
installAudio();
await loadLanguage("pt-BR");

await checkSession();
await openSavedScreen();

// Reabre a tela gravada no endereço (ver systems/router.js); sem tela válida, abre o menu.
async function openSavedScreen() {
    const route = getRoute();
    const loggedIn = Boolean(getSession()?.token);
    const backToModes = () => loadModes(loadMenu);
    const params = route?.params ?? {};

    try {
        switch (route?.name) {
            case "modes":
                loadModes(loadMenu);
                return;
            case "classic": {
                const mode = params.mode ?? "classic";
                const wordTarget = Number(params.wordTarget);
                if (!["classic", "learning", "hardcore"].includes(mode)) break;
                if (mode === "learning" && (!params.theme || ![5, 10, 25, 50].includes(wordTarget))) break;
                await loadClassic(backToModes, {
                    mode,
                    theme: params.theme ?? null,
                    wordTarget: mode === "learning" ? wordTarget : null
                });
                return;
            }
            case "versus":
                if (!loggedIn) break;
                await loadVersus(backToModes);
                return;
            case "flashcards": {
                const views = ["decks", "create", "statistics", "shop", "edit", "study"];
                if (!loggedIn || !views.includes(params.view)) break;
                await loadFlashcards(backToModes, params.view, params.deck ?? null);
                return;
            }
        }
    } catch (error) {
        console.error("Could not restore the saved screen", error);
    }
    loadMenu();
}

if ("serviceWorker" in navigator && window.isSecureContext) {
    window.addEventListener("load", () => {
        const workerUrl = new URL("../service-worker.js", import.meta.url);
        const scope = new URL("../", import.meta.url).pathname;
        navigator.serviceWorker.register(workerUrl, { scope }).catch(() => {
            // A aplicação continua funcionando normalmente sem cache offline.
        });
    });
}
