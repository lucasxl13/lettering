import { t } from "../systems/language.js";
import { getSession } from "../systems/auth.js";
import { registerModal } from "../systems/modal.js";
import { startGridEffects } from "../systems/grid-effects.js";
import { loadClassic } from "./classic.js";
import { loadVersus } from "./versus.js";
import { getRanking } from "../api/matchesApi.js";

import { loadFlashcards } from "./flashcards.js";
import { GENERAL_DECK_ID } from "../systems/flashcards.js";
import { getFlashcards } from "../api/flashcardsApi.js";

const SELECTED_MODE_KEY = "lettering-selected-mode";
const SELECTED_FLASHCARD_DECK_KEY = "lettering-selected-flashcard-deck";
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
    },
    {
        id: "versus",
        icon: "⚔",
        titleKey: "versus_mode",
        descriptionKey: "versus_description"
    },
    {
        id: "flashcards",
        icon: "?",
        titleKey: "flashcards_mode",
        descriptionKey: "flashcards_description"
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
    if (!session && selectedMode.id === "flashcards") selectedMode = MODES[0];
    let selectedTheme = null;
    let flashcardDecks = [];
    let selectedFlashcardDeckId = getSelectedFlashcardDeckId(flashcardDecks);

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
                    class="mode-menu-button theme-button ${selectedMode.id !== "learning" ? "hidden" : ""}"
                    id="open-theme-selector"
                >
                    ${createThemeLabel(selectedTheme)}
                </button>

                <button
                    class="mode-menu-button ranking-button ${selectedMode.id === "flashcards" ? "hidden" : ""}"
                    id="ranking-button"
                    ${session ? "" : "disabled"}
                >
                    ${t("ranking")}
                </button>

                <button
                    class="mode-menu-button flashcards-menu-button ${selectedMode.id === "flashcards" ? "" : "hidden"}"
                    id="flashcards-decks-button"
                    ${session ? "" : "disabled"}
                >
                    ${createFlashcardDeckLabel(selectedFlashcardDeckId, flashcardDecks)}
                </button>

                <button
                    class="mode-menu-button flashcards-menu-button ${selectedMode.id === "flashcards" ? "" : "hidden"}"
                    id="flashcards-statistics-button"
                    ${session ? "" : "disabled"}
                >
                    ${t("statistics")}
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
    const rankingButton = document.getElementById("ranking-button");
    const flashcardsDeckButton = document.getElementById("flashcards-decks-button");
    if (session) {
        flashcardsDeckButton.disabled = true;
        getFlashcards().then(result => {
            if (!flashcardsDeckButton.isConnected) return;
            flashcardDecks = result.decks;
            selectedFlashcardDeckId = getSelectedFlashcardDeckId(flashcardDecks);
            flashcardsDeckButton.innerHTML = createFlashcardDeckLabel(selectedFlashcardDeckId, flashcardDecks);
            flashcardsDeckButton.disabled = false;
        }).catch(() => {
            if (!flashcardsDeckButton.isConnected) return;
            flashcardsDeckButton.innerHTML = t("fc_load_error");
            flashcardsDeckButton.disabled = false;
        });
    }
    flashcardsDeckButton.addEventListener("click", () => openFlashcardDeckSelector(
        selectedFlashcardDeckId,
        flashcardDecks,
        deckId => {
            selectedFlashcardDeckId = deckId;
            localStorage.setItem(`${SELECTED_FLASHCARD_DECK_KEY}:${session.user.id}`, deckId);
            flashcardsDeckButton.innerHTML = createFlashcardDeckLabel(deckId, flashcardDecks);
        },
        () => loadFlashcards(() => loadModes(onBack))
    ));
    document.getElementById("flashcards-statistics-button").addEventListener("click", () => loadFlashcards(() => loadModes(onBack), "statistics"));
    const flashcardsMenuButtons = document.querySelectorAll(".flashcards-menu-button");

    playButton.addEventListener("click", () => {
        if (selectedMode.id === "flashcards") {
            loadFlashcards(() => loadModes(onBack), "study", selectedFlashcardDeckId);
            return;
        }

        if (selectedMode.id === "versus") {
            if (!session) {
                window.alert(t("versus_login_required"));
                return;
            }
            loadVersus(() => loadModes(onBack));
            return;
        }

        if (selectedMode.id === "learning" && !selectedTheme) {
            openThemeSelector(null, theme => {
                selectedTheme = theme;
                themeButton.innerHTML = createThemeLabel(theme);
                openWordGoalSelector(wordTarget => startSelectedMode(wordTarget));
            });
            return;
        }

        if (selectedMode.id === "learning") {
            openWordGoalSelector(wordTarget => startSelectedMode(wordTarget));
            return;
        }

        startSelectedMode(null);
    });

    function startSelectedMode(wordTarget) {
        loadClassic(() => loadModes(onBack), {
            mode: selectedMode.id,
            theme: getGameTheme(selectedTheme),
            wordTarget
        });
    }

    document.getElementById("open-mode-selector").addEventListener("click", () => {
        openModeSelector(selectedMode.id, Boolean(session), mode => {
            selectedMode = mode;
            selectedTheme = null;
            localStorage.setItem(SELECTED_MODE_KEY, mode.id);
            playButton.innerHTML = createPlayLabel(mode);
            themeButton.classList.toggle("hidden", mode.id !== "learning");
            rankingButton.classList.toggle("hidden", ["flashcards", "versus"].includes(mode.id));
            flashcardsMenuButtons.forEach(button => {
                button.classList.toggle("hidden", mode.id !== "flashcards");
            });
        });
    });

    themeButton.addEventListener("click", () => {
        openThemeSelector(selectedTheme?.id, theme => {
            selectedTheme = theme;
            themeButton.innerHTML = createThemeLabel(theme);
        });
    });

    rankingButton.addEventListener("click", () => {
        if (!session) return;
        if (selectedMode.id !== "learning") {
            openRanking({ mode: selectedMode.id }, session);
            return;
        }

        const chooseGoal = () => openWordGoalSelector(wordTarget => {
            openRanking({
                mode: selectedMode.id,
                theme: selectedTheme.id,
                wordTarget
            }, session);
        });

        if (selectedTheme) chooseGoal();
        else openThemeSelector(null, theme => {
            selectedTheme = theme;
            themeButton.innerHTML = createThemeLabel(theme);
            chooseGoal();
        });
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

            <div class="mode-selector-list theme-selector-list">
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
}

async function openRanking(filters, session) {
    if (document.querySelector(".ranking-overlay")) return;
    const learning = filters.mode === "learning";
    const overlay = document.createElement("div");
    overlay.className = "mode-selector-overlay ranking-overlay";
    overlay.innerHTML = `
        <section class="mode-selector ranking-panel" role="dialog" aria-modal="true" aria-labelledby="ranking-title">
            <header class="ranking-header">
                <div><h2 id="ranking-title">${t("ranking")}</h2><p>${createRankingSubtitle(filters)}</p></div>
                <span>TOP 100</span>
            </header>
            <div class="ranking-columns">
                <span>#</span><span>${t("player")}</span>
                <span>${learning ? t("elapsed_time") : t("score")}</span>
                <span>${learning ? t("score") : t("elapsed_time")}</span>
            </div>
            <div class="ranking-scroll"><p class="ranking-state">${t("loading_ranking")}</p></div>
            <div class="ranking-current"></div>
            <button class="mode-menu-button close-ranking">${t("back")}</button>
        </section>
    `;
    document.body.appendChild(overlay);
    const modal = registerModal(overlay, "ranking");
    overlay.querySelector(".close-ranking").addEventListener("click", modal.close);

    try {
        const ranking = await getRanking(filters);
        if (!overlay.isConnected) return;
        const ownId = ranking.currentUser?.userId ?? session.user?.id;
        const entries = ranking.entries;
        overlay.querySelector(".ranking-scroll").innerHTML = entries.length
            ? entries.map(entry => createRankingRow(entry, learning, entry.userId === ownId)).join("")
            : `<p class="ranking-state">${t("empty_ranking")}</p>`;
        renderCurrentRankingRow(
            overlay, ranking.currentUser ?? emptyCurrentUser(session), learning
        );
    } catch {
        if (!overlay.isConnected) return;
        overlay.querySelector(".ranking-scroll").innerHTML =
            `<p class="ranking-state ranking-error">${t("ranking_error")}</p>`;
        renderCurrentRankingRow(overlay, emptyCurrentUser(session), learning);
    }
}

function renderCurrentRankingRow(overlay, entry, learning) {
    overlay.querySelector(".ranking-current").innerHTML = `
        <small>${t("your_position")}</small>
        ${createRankingRow(entry, learning, true, true)}
    `;
}

function emptyCurrentUser(session) {
    return {
        position: "–",
        username: session.user?.username ?? session.user?.email ?? t("player"),
        score: null,
        gameTimeMs: null
    };
}

function createRankingSubtitle(filters) {
    if (filters.mode !== "learning") return t(`${filters.mode}_mode`);
    const theme = LEARNING_THEMES.find(item => item.id === filters.theme);
    return `${t(theme?.titleKey ?? "themes")} · ${filters.wordTarget} ${t("words")}`;
}

function createRankingRow(entry, learning, current = false, pinned = false) {
    const score = entry.score === null ? "–" : String(entry.score);
    const time = entry.gameTimeMs === null ? "–" : formatRankingTime(entry.gameTimeMs);
    return `
        <div class="ranking-row ${current ? "current-user" : ""} ${pinned ? "pinned-user" : ""}">
            <span>${entry.position}</span>
            <strong title="${escapeRankingHtml(entry.username)}">${escapeRankingHtml(entry.username)}</strong>
            <span>${learning ? time : score}</span>
            <span>${learning ? score : time}</span>
        </div>
    `;
}

function formatRankingTime(milliseconds) {
    const seconds = Math.max(0, Math.floor(Number(milliseconds) / 1000));
    return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

function escapeRankingHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;").replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

function openWordGoalSelector(onSelect) {
    if (document.querySelector(".word-goal-overlay")) return;

    const overlay = document.createElement("div");
    overlay.className = "mode-selector-overlay word-goal-overlay";
    overlay.innerHTML = `
        <section class="mode-selector word-goal-selector" role="dialog" aria-modal="true" aria-labelledby="word-goal-title">
            <h2 id="word-goal-title">${t("choose_word_goal")}</h2>
            <p>${t("choose_word_goal_description")}</p>

            <div class="word-goal-options">
                ${[5, 10, 25, 50].map(amount => `
                    <button class="word-goal-option" data-word-target="${amount}">
                        <strong>${amount}</strong>
                        <span>${t("words")}</span>
                    </button>
                `).join("")}
            </div>

            <button class="mode-menu-button close-word-goal-selector">${t("back")}</button>
        </section>
    `;

    document.body.appendChild(overlay);
    const modal = registerModal(overlay, "word-goal-selector");

    overlay.querySelectorAll(".word-goal-option").forEach(button => {
        button.addEventListener("click", () => {
            onSelect(Number(button.dataset.wordTarget));
            modal.dismiss();
        });
    });

    overlay.querySelector(".close-word-goal-selector").addEventListener("click", modal.close);
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

function openModeSelector(selectedModeId, authenticated, onSelect) {
    if (document.querySelector(".mode-selector-overlay")) return;

    const overlay = document.createElement("div");
    overlay.className = "mode-selector-overlay";
    overlay.innerHTML = `
        <section class="mode-selector" role="dialog" aria-modal="true" aria-labelledby="mode-selector-title">
            <h2 id="mode-selector-title">${t("choose_mode")}</h2>

            <div class="mode-selector-list">
                ${MODES.map(mode => createModeOption(mode, selectedModeId, authenticated)).join("")}
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
}

function getGameTheme(theme) {
    return theme?.id ?? null;
}

function createModeOption(mode, selectedModeId, authenticated) {
    const isSelected = mode.id === selectedModeId;
    const requiresAccount = ["flashcards", "versus"].includes(mode.id) && !authenticated;

    return `
        <button
            class="mode-option ${isSelected ? "selected" : ""}"
            data-mode="${mode.id}"
            aria-pressed="${isSelected}"
            ${requiresAccount ? "disabled" : ""}
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
        <span class="mode-button-kicker">${t("play")}</span>
        <strong>${t(mode.titleKey)}</strong>
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

function getSelectedFlashcardDeckId(decks) {
    const session = getSession();
    const saved = session
        ? localStorage.getItem(`${SELECTED_FLASHCARD_DECK_KEY}:${session.user.id}`)
        : null;
    return saved === GENERAL_DECK_ID || decks.some(deck => deck.id === saved)
        ? saved
        : GENERAL_DECK_ID;
}

function createFlashcardDeckLabel(deckId, decks) {
    const name = deckId === GENERAL_DECK_ID
        ? t("fc_general")
        : decks.find(deck => deck.id === deckId)?.name ?? t("fc_general");
    return `<span class="mode-button-kicker">${t("fc_my_deck")}</span><strong>${escapeHtml(name)}</strong>`;
}

function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, character => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[character]);
}

function openFlashcardDeckSelector(selectedId, decks, onSelect, onManage) {
    if (document.querySelector(".mode-selector-overlay")) return;
    const choices = [
        { id: GENERAL_DECK_ID, name: t("fc_general"), detail: t("fc_general_description") },
        ...decks.map(deck => ({
            id: deck.id,
            name: deck.name,
            detail: `${deck.cards.length} ${t("fc_cards")}`
        }))
    ];
    const overlay = document.createElement("div");
    overlay.className = "mode-selector-overlay flashcard-deck-selector-overlay";
    overlay.innerHTML = `
        <section class="mode-selector" role="dialog" aria-modal="true" aria-labelledby="flashcard-deck-selector-title">
            <h2 id="flashcard-deck-selector-title">${t("fc_choose_deck_title")}</h2>
            <p>${t("fc_choose_deck_help")}</p>
            <div class="mode-selector-list flashcard-deck-options">
                ${choices.map(deck => `<button class="mode-option flashcard-deck-option ${deck.id === selectedId ? "selected" : ""}" data-deck-id="${escapeHtml(deck.id)}" aria-pressed="${deck.id === selectedId}"><span class="mode-option-icon" aria-hidden="true">${deck.id === GENERAL_DECK_ID ? "∞" : "▦"}</span><span class="mode-option-content"><strong>${escapeHtml(deck.name)}</strong><small>${escapeHtml(deck.detail)}</small></span><span class="deck-selected-check" aria-hidden="true">✓</span></button>`).join("")}
            </div>
            <div class="flashcard-selector-actions">
                <button class="mode-menu-button close-flashcard-deck-selector">${t("back")}</button>
                <button class="mode-menu-button manage-flashcard-decks">${t("fc_manage_decks")}</button>
            </div>
        </section>`;
    document.body.appendChild(overlay);
    const modal = registerModal(overlay, "flashcard-deck-selector");
    overlay.querySelectorAll("[data-deck-id]").forEach(button => button.addEventListener("click", () => {
        onSelect(button.dataset.deckId);
        modal.dismiss();
    }));
    overlay.querySelector(".manage-flashcard-decks").addEventListener("click", () => {
        modal.dismiss();
        onManage();
    });
    overlay.querySelector(".close-flashcard-deck-selector").addEventListener("click", modal.close);
}
