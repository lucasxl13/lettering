import { loadLanguage } from "./systems/language.js";
import { loadTheme } from "./systems/theme.js";
import { loadMenu } from "./screens/menu.js";
import { checkSession } from "./systems/auth.js";
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
loadMenu();

if ("serviceWorker" in navigator && window.isSecureContext) {
    window.addEventListener("load", () => {
        const workerUrl = new URL("../service-worker.js", import.meta.url);
        const scope = new URL("../", import.meta.url).pathname;
        navigator.serviceWorker.register(workerUrl, { scope }).catch(() => {
            // A aplicação continua funcionando normalmente sem cache offline.
        });
    });
}
