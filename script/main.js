import { loadLanguage } from "./systems/language.js";
import { loadTheme } from "./systems/theme.js";
import { loadMenu } from "./screens/menu.js";
import { checkSession } from "./systems/auth.js";
import { installAudio } from "./systems/audio-player.js";

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
