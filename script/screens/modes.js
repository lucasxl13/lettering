import { t } from "../systems/language.js";
import { getSession } from "../systems/auth.js";
import { registerModal } from "../systems/modal.js";
import { startGridEffects } from "../systems/grid-effects.js";
import { loadClassic } from "./classic.js";

const SELECTED_MODE_KEY = "lettering-selected-mode";
const MODES = [
    {
        id: "classic",
        icon: "A",
        titleKey: "classic_mode",
        descriptionKey: "classic_description"
    },
    {
        id: "learning",
        icon: "B",
        titleKey: "learning_mode",
        descriptionKey: "learning_description"
    },
    {
        id: "hardcore",
        icon: "!",
        titleKey: "hardcore_mode",
        descriptionKey: "hardcore_description"
    }
];

const LEARNING_THEMES = [
    { id: "animals", titleKey: "animals_theme" },
    { id: "objects", titleKey: "objects_theme" },
    { id: "verbs", titleKey: "verbs_theme" },
    { id: "food", titleKey: "food_theme" },
    { id: "places", titleKey: "places_theme" },
    { id: "adjectives", titleKey: "adjectives_theme" },
    { id: "colors", titleKey: "colors_theme" },
    { id: "nature", titleKey: "nature_theme" },
    { id: "professions", titleKey: "professions_theme" }
];

export function loadModes(onBack) {
    const app = document.getElementById("app");
    const session = getSession();
    let selectedMode = getSelectedMode();
    let selectedTheme = null;

    // TODO(SERVER-INTEGRATION): quando houver uma sessão validada, buscar
    // progresso, desbloqueios e permissão de acesso ao ranking no backend.

    app.innerHTML = `
        <main class="modes-screen">
            <h1>LETTERING</h1>

            <div class="mode-menu">
                <button class="mode-menu-button" id="open-mode-selector">
                    ${t("modes")}
                </button>

                <button class="mode-menu-button primary-mode-button separated-button" id="play-selected-mode">
                    ${createPlayLabel(selectedMode)}
                </button>

                <button
                    class="mode-menu-button theme-button ${selectedMode.id === "learning" ? "" : "hidden"}"
                    id="open-theme-selector"
                >
                    ${createThemeLabel(selectedTheme)}
                </button>

                <button
                    class="mode-menu-button ranking-button"
                    id="ranking-button"
                    ${session ? "" : "disabled"}
                >
                    ${t("ranking")}
                </button>

                <button class="mode-menu-button" id="back-to-menu">
                    ${t("back")}
                </button>
            </div>
        </main>
    `;

    startGridEffects(document.querySelector(".modes-screen"));

    const playButton = document.getElementById("play-selected-mode");
    const themeButton = document.getElementById("open-theme-selector");

    playButton.addEventListener("click", () => {
        if (selectedMode.id === "classic") {
            loadClassic(() => loadModes(onBack));
            return;
        }

        // TODO(GAME-MODE): implementar as partidas dos modos Aprendizado e Hardcore.
    });

    document.getElementById("open-mode-selector").addEventListener("click", () => {
        openModeSelector(selectedMode.id, mode => {
            selectedMode = mode;
            localStorage.setItem(SELECTED_MODE_KEY, mode.id);
            playButton.innerHTML = createPlayLabel(mode);
            themeButton.classList.toggle("hidden", mode.id !== "learning");
        });
    });

    themeButton.addEventListener("click", () => {
        openThemeSelector(selectedTheme?.id, theme => {
            selectedTheme = theme;
            themeButton.innerHTML = createThemeLabel(theme);
        });
    });

    document.getElementById("ranking-button").addEventListener("click", () => {
        if (!session) return;

        // TODO(RANKING): abrir a tela e buscar o ranking no backend.
    });

    document.getElementById("back-to-menu").addEventListener("click", onBack);
}

function openThemeSelector(selectedThemeId, onSelect) {
    if (document.querySelector(".theme-selector-overlay")) return;

    const overlay = document.createElement("div");
    overlay.className = "mode-selector-overlay theme-selector-overlay";
    overlay.innerHTML = `
        <section class="mode-selector" role="dialog" aria-modal="true" aria-labelledby="theme-selector-title">
            <h2 id="theme-selector-title">${t("choose_theme")}</h2>

            <div class="mode-selector-list">
                ${LEARNING_THEMES.map(theme => createThemeOption(theme, selectedThemeId)).join("")}
            </div>

            <button class="mode-menu-button close-theme-selector">${t("back")}</button>
        </section>
    `;

    document.body.appendChild(overlay);
    const modal = registerModal(overlay, "theme-selector");

    overlay.querySelectorAll(".learning-theme-option").forEach(button => {
        button.addEventListener("click", () => {
            const theme = LEARNING_THEMES.find(item => item.id === button.dataset.theme);
            if (!theme) return;

            onSelect(theme);
            modal.dismiss();
        });
    });

    overlay.querySelector(".close-theme-selector").addEventListener("click", modal.close);
    overlay.addEventListener("click", event => {
        if (event.target === overlay) modal.close();
    });
}

function createThemeOption(theme, selectedThemeId) {
    const isSelected = theme.id === selectedThemeId;

    return `
        <button
            class="mode-option learning-theme-option ${isSelected ? "selected" : ""}"
            data-theme="${theme.id}"
            aria-pressed="${isSelected}"
        >
            <strong>${t(theme.titleKey)}</strong>
        </button>
    `;
}

function openModeSelector(selectedModeId, onSelect) {
    if (document.querySelector(".mode-selector-overlay")) return;

    const overlay = document.createElement("div");
    overlay.className = "mode-selector-overlay";
    overlay.innerHTML = `
        <section class="mode-selector" role="dialog" aria-modal="true" aria-labelledby="mode-selector-title">
            <h2 id="mode-selector-title">${t("choose_mode")}</h2>

            <div class="mode-selector-list">
                ${MODES.map(mode => createModeOption(mode, selectedModeId)).join("")}
            </div>

            <button class="mode-menu-button close-mode-selector">${t("back")}</button>
        </section>
    `;

    document.body.appendChild(overlay);
    const modal = registerModal(overlay, "mode-selector");

    overlay.querySelectorAll(".mode-option").forEach(button => {
        button.addEventListener("click", () => {
            const mode = MODES.find(item => item.id === button.dataset.mode);
            if (!mode) return;

            onSelect(mode);
            modal.dismiss();
        });
    });

    overlay.querySelector(".close-mode-selector").addEventListener("click", modal.close);
    overlay.addEventListener("click", event => {
        if (event.target === overlay) modal.close();
    });
}

function createModeOption(mode, selectedModeId) {
    const isSelected = mode.id === selectedModeId;

    return `
        <button
            class="mode-option ${isSelected ? "selected" : ""}"
            data-mode="${mode.id}"
            aria-pressed="${isSelected}"
        >
            <span class="mode-option-icon" aria-hidden="true">${mode.icon}</span>
            <span class="mode-option-content">
                <strong>${t(mode.titleKey)}</strong>
                <small>${t(mode.descriptionKey)}</small>
            </span>
        </button>
    `;
}

function createPlayLabel(mode) {
    return `
        <span>${t("play")}:</span>
        <strong>(${t(mode.titleKey)})</strong>
    `;
}

function createThemeLabel(theme) {
    if (!theme) return t("themes");

    return `
        <span>${t("theme")}:</span>
        <strong>(${t(theme.titleKey)})</strong>
    `;
}

function getSelectedMode() {
    const selectedModeId = localStorage.getItem(SELECTED_MODE_KEY);
    return MODES.find(mode => mode.id === selectedModeId) ?? MODES[0];
}
