import { getSession } from "./auth.js";
import { t } from "./language.js";

export const TOUR_VERSION = 2;

const TOUR_SCREENS = {
    menu: ".menu",
    modes: ".modes-screen",
    game: ".classic-screen",
    versus: ".versus-lobby",
    flashcards: ".fc-screen"
};

let activeTour = null;
let pendingStartTimer = null;
let pendingStartScope = null;

export function getTourStorageKey(userId, scope = "menu") {
    const suffix = scope === "menu" ? "" : `:${encodeURIComponent(scope)}`;
    return `lettering-tour:${TOUR_VERSION}:${encodeURIComponent(String(userId))}${suffix}`;
}

export function hasCompletedTour(userId, storage = window.localStorage, scope = "menu") {
    if (!userId) return false;

    try {
        return storage.getItem(getTourStorageKey(userId, scope)) === "complete";
    } catch {
        return false;
    }
}

export function shouldShowTour(session, storage = window.localStorage, scope = "menu") {
    const owner = getTourOwner(session, scope);
    return Boolean(owner) && !hasCompletedTour(owner, storage, scope);
}

export function maybeStartTour({ scope = "menu", delay = 700, onOpen, onClose } = {}) {
    const session = getSession();
    if (!shouldShowTour(session, window.localStorage, scope) || activeTour) return false;
    if (pendingStartTimer) {
        if (pendingStartScope === scope) return false;
        window.clearTimeout(pendingStartTimer);
        pendingStartTimer = null;
    }
    pendingStartScope = scope;

    pendingStartTimer = window.setTimeout(() => {
        pendingStartTimer = null;
        pendingStartScope = null;
        const currentSession = getSession();
        if (!shouldShowTour(currentSession, window.localStorage, scope) || activeTour) return;
        if (!document.querySelector(TOUR_SCREENS[scope]) || document.querySelector(".login-overlay, .settings-overlay, .mode-selector-overlay, .pause-overlay")) return;
        startTour(scope, { onOpen, onClose });
    }, delay);
    return true;
}

export function startTour(scope = "menu", { onOpen, onClose } = {}) {
    const session = getSession();
    const owner = getTourOwner(session, scope);
    if (!owner || !TOUR_SCREENS[scope]) return false;

    if (pendingStartTimer) {
        window.clearTimeout(pendingStartTimer);
        pendingStartTimer = null;
        pendingStartScope = null;
    }
    activeTour?.close(false);

    const steps = createSteps(scope);
    const previousFocus = document.activeElement;
    const lifecycle = new AbortController();
    const overlay = document.createElement("div");
    overlay.className = "tour-guide";
    overlay.setAttribute("aria-live", "polite");
    overlay.innerHTML = `
        <div class="tour-spotlight" aria-hidden="true"></div>
        <section class="tour-card" role="dialog" aria-modal="true" aria-labelledby="tour-title"></section>
    `;

    const spotlight = overlay.querySelector(".tour-spotlight");
    const card = overlay.querySelector(".tour-card");
    let stepIndex = 0;
    let closed = false;
    let transitioning = false;

    overlay.dataset.scope = scope;
    document.body.appendChild(overlay);
    document.body.classList.add("tour-is-open");
    onOpen?.();

    function markComplete() {
        try {
            window.localStorage.setItem(getTourStorageKey(owner, scope), "complete");
        } catch {
            // The tour still works when browser storage is unavailable.
        }
    }

    function close(remember = true) {
        if (closed) return;
        closed = true;
        if (remember) markComplete();
        lifecycle.abort();
        overlay.classList.add("is-leaving");
        document.body.classList.remove("tour-is-open");
        window.setTimeout(() => overlay.remove(), 260);
        activeTour = null;
        onClose?.({ completed: remember, scope });
        if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus();
    }

    function changeStep(offset) {
        if (transitioning) return;
        const nextIndex = Math.min(steps.length - 1, Math.max(0, stepIndex + offset));
        if (nextIndex === stepIndex) return;
        transitioning = true;
        const direction = offset > 0 ? "forward" : "backward";
        card.classList.remove("is-entering");
        card.classList.add(`is-exiting-${direction}`);
        window.setTimeout(() => {
            stepIndex = nextIndex;
            render(direction);
            transitioning = false;
        }, 150);
    }

    function render(direction = "initial") {
        const step = steps[stepIndex];
        const target = resolveTarget(step.selector);
        const isLast = stepIndex === steps.length - 1;
        const progressText = t("tour_step_progress")
            .replace("{current}", String(stepIndex + 1))
            .replace("{total}", String(steps.length));

        overlay.classList.toggle("has-target", Boolean(target));
        card.classList.remove("is-entering", "is-exiting-forward", "is-exiting-backward");
        card.dataset.direction = direction;
        card.innerHTML = `
            <div class="tour-card-glow" aria-hidden="true"></div>
            <div class="tour-card-header">
                <span class="tour-kicker">${escapeHtml(step.kicker)}</span>
                <button class="tour-skip" type="button">${escapeHtml(t("tour_skip"))}</button>
            </div>
            <div class="tour-visual tour-visual-${step.visual}" aria-hidden="true">
                ${createVisual(step.visual)}
            </div>
            <h2 id="tour-title">${escapeHtml(step.title)}</h2>
            <p>${escapeHtml(step.body)}</p>
            <div class="tour-progress" aria-label="${escapeHtml(progressText)}">
                ${steps.map((_, index) => `<span class="${index === stepIndex ? "active" : ""}" aria-hidden="true"></span>`).join("")}
                <small>${escapeHtml(progressText)}</small>
            </div>
            <div class="tour-actions">
                <button class="tour-back" type="button" ${stepIndex === 0 ? "disabled" : ""}>${escapeHtml(t("tour_back"))}</button>
                <button class="tour-next" type="button">${escapeHtml(t(isLast ? "tour_finish" : "tour_next"))}</button>
            </div>
        `;

        card.querySelector(".tour-skip").addEventListener("click", () => close(true));
        card.querySelector(".tour-back").addEventListener("click", () => changeStep(-1));
        card.querySelector(".tour-next").addEventListener("click", () => {
            if (isLast) close(true);
            else changeStep(1);
        });

        positionSpotlight(target);
        requestAnimationFrame(() => {
            positionCard(target);
            card.classList.add("is-entering");
            card.querySelector(".tour-next")?.focus({ preventScroll: true });
        });
    }

    function positionSpotlight(target) {
        if (!target) {
            spotlight.removeAttribute("style");
            return;
        }

        const rect = target.getBoundingClientRect();
        const padding = 10;
        spotlight.style.left = `${Math.max(6, rect.left - padding)}px`;
        spotlight.style.top = `${Math.max(6, rect.top - padding)}px`;
        spotlight.style.width = `${Math.min(window.innerWidth - 12, rect.width + padding * 2)}px`;
        spotlight.style.height = `${Math.min(window.innerHeight - 12, rect.height + padding * 2)}px`;
    }

    function positionCard(target) {
        const usesMobileLayout = window.matchMedia("(max-width: 700px)").matches;
        card.classList.toggle(
            "is-mobile-top",
            Boolean(usesMobileLayout && target && target.getBoundingClientRect().top > window.innerHeight * .55)
        );

        if (!target || usesMobileLayout) {
            card.removeAttribute("style");
            return;
        }

        const targetRect = target.getBoundingClientRect();
        const cardRect = card.getBoundingClientRect();
        const margin = 18;
        const gap = 22;
        const centeredLeft = targetRect.left + targetRect.width / 2 - cardRect.width / 2;
        const left = Math.min(window.innerWidth - cardRect.width - margin, Math.max(margin, centeredLeft));
        let top = targetRect.bottom + gap;
        let placement = "bottom";

        if (top + cardRect.height > window.innerHeight - margin) {
            top = targetRect.top - cardRect.height - gap;
            placement = "top";
        }
        if (top < margin) {
            const sideTop = Math.min(
                window.innerHeight - cardRect.height - margin,
                Math.max(margin, targetRect.top + targetRect.height / 2 - cardRect.height / 2)
            );
            if (targetRect.right + gap + cardRect.width <= window.innerWidth - margin) {
                card.style.left = `${targetRect.right + gap}px`;
                card.style.top = `${sideTop}px`;
                card.style.transform = "none";
                card.dataset.placement = "right";
                return;
            }
            if (targetRect.left - gap - cardRect.width >= margin) {
                card.style.left = `${targetRect.left - gap - cardRect.width}px`;
                card.style.top = `${sideTop}px`;
                card.style.transform = "none";
                card.dataset.placement = "left";
                return;
            }
            top = Math.max(margin, (window.innerHeight - cardRect.height) / 2);
            placement = "center";
        }

        card.style.left = `${left}px`;
        card.style.top = `${top}px`;
        card.style.transform = "none";
        card.dataset.placement = placement;
    }

    function handleKeydown(event) {
        if (event.key === "Escape") {
            event.preventDefault();
            close(true);
        } else if (event.key === "ArrowRight" || event.key === "Enter") {
            if (event.key === "Enter" && event.target instanceof HTMLButtonElement) return;
            event.preventDefault();
            if (stepIndex === steps.length - 1) close(true);
            else changeStep(1);
        } else if (event.key === "ArrowLeft") {
            event.preventDefault();
            changeStep(-1);
        } else if (event.key === "Tab") {
            const focusable = [...card.querySelectorAll("button:not([disabled])")];
            if (!focusable.length) return;
            const first = focusable[0];
            const last = focusable.at(-1);
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        }
    }

    window.addEventListener("resize", () => render(), { signal: lifecycle.signal });
    window.addEventListener("orientationchange", () => render(), { signal: lifecycle.signal });
    document.addEventListener("keydown", handleKeydown, { signal: lifecycle.signal });

    activeTour = { close, scope };
    render();
    return true;
}

function getTourOwner(session, scope) {
    if (session?.user?.id) return session.user.id;
    return ["modes", "game"].includes(scope) ? "guest" : null;
}

function resolveTarget(selectors) {
    const candidates = Array.isArray(selectors) ? selectors : selectors ? [selectors] : [];
    for (const selector of candidates) {
        const target = document.querySelector(selector);
        if (!target) continue;
        const rect = target.getBoundingClientRect();
        const style = window.getComputedStyle(target);
        if (rect.width > 0 && rect.height > 0 && style.visibility !== "hidden" && style.display !== "none") {
            return target;
        }
    }
    return null;
}

function createSteps(scope) {
    if (scope === "modes") return createModesSteps();
    if (scope === "game") return createGameSteps();
    if (scope === "versus") return createVersusSteps();
    if (scope === "flashcards") return createFlashcardSteps();
    return [
        {
            selector: null,
            visual: "letters",
            kicker: t("tour_welcome_kicker"),
            title: t("tour_welcome_title"),
            body: t("tour_welcome_body")
        },
        {
            selector: ".account-card",
            visual: "xp",
            kicker: t("tour_profile_kicker"),
            title: t("tour_profile_title"),
            body: t("tour_profile_body")
        },
        {
            selector: "#play-button",
            visual: "modes",
            kicker: t("tour_play_kicker"),
            title: t("tour_play_title"),
            body: t("tour_play_body")
        },
        {
            selector: "#settings-button",
            visual: "settings",
            kicker: t("tour_settings_kicker"),
            title: t("tour_settings_title"),
            body: t("tour_settings_body")
        },
        {
            selector: ".languages",
            visual: "language",
            kicker: t("tour_language_kicker"),
            title: t("tour_language_title"),
            body: t("tour_language_body")
        },
        {
            selector: null,
            visual: "ready",
            kicker: t("tour_ready_kicker"),
            title: t("tour_ready_title"),
            body: t("tour_ready_body")
        }
    ];
}

function createModesSteps() {
    return [
        {
            selector: null,
            visual: "selector",
            kicker: t("tour_play_kicker"),
            title: t("tour_modes_welcome_title"),
            body: t("tour_modes_welcome_body")
        },
        {
            selector: "#open-mode-selector",
            visual: "selector",
            kicker: t("tour_play_kicker"),
            title: t("tour_modes_select_title"),
            body: t("tour_modes_select_body")
        },
        {
            selector: "#play-selected-mode",
            visual: "play",
            kicker: t("tour_play_kicker"),
            title: t("tour_modes_start_title"),
            body: t("tour_modes_start_body")
        },
        {
            selector: ["#open-theme-selector:not(.hidden)", "#open-mode-selector"],
            visual: "learning",
            kicker: t("tour_play_kicker"),
            title: t("tour_modes_learning_title"),
            body: t("tour_modes_learning_body")
        },
        {
            selector: "#ranking-button",
            visual: "ranking",
            kicker: t("tour_play_kicker"),
            title: t("tour_modes_ranking_title"),
            body: t("tour_modes_ranking_body")
        }
    ];
}

function createGameSteps() {
    return [
        {
            selector: ".current-batch",
            visual: "letters",
            kicker: t("tour_ready_kicker"),
            title: t("tour_game_letters_title"),
            body: t("tour_game_letters_body")
        },
        {
            selector: ".classic-board",
            visual: "controls",
            kicker: t("tour_ready_kicker"),
            title: t("tour_game_board_title"),
            body: t("tour_game_board_body")
        },
        {
            selector: ["#active-word-cycle:not(.hidden)", ".classic-board"],
            visual: "words",
            kicker: t("tour_ready_kicker"),
            title: t("tour_game_words_title"),
            body: t("tour_game_words_body")
        },
        {
            selector: "#power-toolbar",
            visual: "powers",
            kicker: t("tour_ready_kicker"),
            title: t("tour_game_powers_title"),
            body: t("tour_game_powers_body")
        },
        {
            selector: ".found-words-panel",
            visual: "history",
            kicker: t("tour_ready_kicker"),
            title: t("tour_game_history_title"),
            body: t("tour_game_history_body")
        },
        {
            selector: "#pause-game",
            visual: "pause",
            kicker: t("tour_ready_kicker"),
            title: t("tour_game_pause_title"),
            body: t("tour_game_pause_body")
        }
    ];
}

function createVersusSteps() {
    return [
        {
            selector: "#btn-quick-match",
            visual: "versus",
            kicker: t("tour_play_kicker"),
            title: t("tour_versus_quick_title"),
            body: t("tour_versus_quick_body")
        },
        {
            selector: "#btn-create-room",
            visual: "room",
            kicker: t("tour_play_kicker"),
            title: t("tour_versus_room_title"),
            body: t("tour_versus_room_body")
        },
        {
            selector: ".join-room-box",
            visual: "code",
            kicker: t("tour_play_kicker"),
            title: t("tour_versus_join_title"),
            body: t("tour_versus_join_body")
        }
    ];
}

function createFlashcardSteps() {
    return [
        {
            selector: ".fc-dashboard",
            visual: "cards",
            kicker: t("tour_play_kicker"),
            title: t("tour_cards_overview_title"),
            body: t("tour_cards_overview_body")
        },
        {
            selector: ".fc-main-tabs",
            visual: "decks",
            kicker: t("tour_play_kicker"),
            title: t("tour_cards_create_title"),
            body: t("tour_cards_create_body")
        },
        {
            selector: [".fc-decks", ".fc-empty-decks"],
            visual: "study",
            kicker: t("tour_play_kicker"),
            title: t("tour_cards_study_title"),
            body: t("tour_cards_study_body")
        },
        {
            selector: ["[data-action='open-shop']", ".fc-heading"],
            visual: "community",
            kicker: t("tour_play_kicker"),
            title: t("tour_cards_community_title"),
            body: t("tour_cards_community_body")
        }
    ];
}

function createVisual(type) {
    if (type === "letters") {
        return `<span class="tour-letter">W</span><span class="tour-letter">O</span><span class="tour-letter">R</span><span class="tour-letter">D</span>`;
    }
    if (type === "xp") return `<span class="tour-level">I</span><span class="tour-xp-bar"><i></i></span><b>XP</b>`;
    if (type === "modes") return `<span>CLÁSSICO</span><span>FLASHCARDS</span><span>1 × 1</span>`;
    if (type === "settings") return `<span class="tour-gear">⚙</span><i></i><i></i><i></i>`;
    if (type === "language") return `<span>PT</span><span>EN</span><span>ES</span>`;
    if (type === "selector") return `
        <span>${escapeHtml(t("classic_mode"))}</span>
        <span>${escapeHtml(t("learning_mode"))}</span>
        <span>${escapeHtml(t("hardcore_mode"))}</span>
    `;
    if (type === "play") return `<span class="tour-play-triangle"></span><b>${escapeHtml(t("play"))}</b>`;
    if (type === "learning") return `<span>${escapeHtml(t("theme"))}</span><i></i><span>5 · 10 · 25 · 50</span>`;
    if (type === "ranking") return `<b>1</b><span></span><b>2</b><span></span><b>3</b>`;
    if (type === "controls") return `<kbd>A</kbd><kbd>S</kbd><kbd>D</kbd><kbd>Q</kbd>`;
    if (type === "words") return `<span>WORD</span><span>LEARN</span><span>PLAY</span>`;
    if (type === "powers") return `<i></i><i></i><i></i><i></i>`;
    if (type === "history") return `<span></span><span></span><span></span>`;
    if (type === "pause") return `<i></i><i></i>`;
    if (type === "versus") return `<b>1</b><span>VS</span><b>1</b>`;
    if (type === "room") return `<span class="tour-room-node"></span><i></i><span class="tour-room-node"></span>`;
    if (type === "code") return `<b>A</b><b>B</b><b>C</b><b>1</b><b>2</b><b>3</b>`;
    if (type === "cards" || type === "decks") return `<span>WORD</span><span>PALAVRA</span>`;
    if (type === "study") return `<span>WORD</span><i></i><span>${escapeHtml(t("fc_good"))}</span>`;
    if (type === "community") return `<span class="tour-room-node"></span><i></i><span class="tour-room-node"></span><i></i><span class="tour-room-node"></span>`;
    return `<span class="tour-ready-mark">✓</span><span class="tour-ready-pulse"></span>`;
}

function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[character]);
}
