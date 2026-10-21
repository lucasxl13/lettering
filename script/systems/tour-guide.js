import { getSession } from "./auth.js";
import { t } from "./language.js";

export const TOUR_VERSION = 1;

let activeTour = null;
let pendingStartTimer = null;

export function getTourStorageKey(userId) {
    return `lettering-tour:${TOUR_VERSION}:${encodeURIComponent(String(userId))}`;
}

export function hasCompletedTour(userId, storage = window.localStorage) {
    if (!userId) return false;

    try {
        return storage.getItem(getTourStorageKey(userId)) === "complete";
    } catch {
        return false;
    }
}

export function shouldShowTour(session, storage = window.localStorage) {
    return Boolean(session?.user?.id) && !hasCompletedTour(session.user.id, storage);
}

export function maybeStartTour({ delay = 700 } = {}) {
    const session = getSession();
    if (!shouldShowTour(session) || activeTour || pendingStartTimer) return;

    pendingStartTimer = window.setTimeout(() => {
        pendingStartTimer = null;
        const currentSession = getSession();
        if (!shouldShowTour(currentSession) || activeTour) return;
        if (!document.querySelector(".menu") || document.querySelector(".login-overlay, .settings-overlay")) return;
        startTour();
    }, delay);
}

export function startTour() {
    const session = getSession();
    if (!session?.user?.id) return false;

    if (pendingStartTimer) {
        window.clearTimeout(pendingStartTimer);
        pendingStartTimer = null;
    }
    activeTour?.close(false);

    const steps = createSteps();
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

    document.body.appendChild(overlay);
    document.body.classList.add("tour-is-open");

    function markComplete() {
        try {
            window.localStorage.setItem(getTourStorageKey(session.user.id), "complete");
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
        window.setTimeout(() => overlay.remove(), 180);
        activeTour = null;
        if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus();
    }

    function changeStep(offset) {
        const nextIndex = Math.min(steps.length - 1, Math.max(0, stepIndex + offset));
        if (nextIndex === stepIndex) return;
        stepIndex = nextIndex;
        render();
    }

    function render() {
        const step = steps[stepIndex];
        const target = step.selector ? document.querySelector(step.selector) : null;
        const isLast = stepIndex === steps.length - 1;
        const progressText = t("tour_step_progress")
            .replace("{current}", String(stepIndex + 1))
            .replace("{total}", String(steps.length));

        overlay.classList.toggle("has-target", Boolean(target));
        card.classList.remove("is-entering");
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

    activeTour = { close };
    render();
    return true;
}

function createSteps() {
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

function createVisual(type) {
    if (type === "letters") {
        return `<span class="tour-letter">W</span><span class="tour-letter">O</span><span class="tour-letter">R</span><span class="tour-letter">D</span>`;
    }
    if (type === "xp") return `<span class="tour-level">I</span><span class="tour-xp-bar"><i></i></span><b>XP</b>`;
    if (type === "modes") return `<span>CLÁSSICO</span><span>FLASHCARDS</span><span>1 × 1</span>`;
    if (type === "settings") return `<span class="tour-gear">⚙</span><i></i><i></i><i></i>`;
    if (type === "language") return `<span>PT</span><span>EN</span><span>ES</span>`;
    return `<span class="tour-ready-mark">✓</span><span class="tour-ready-pulse"></span>`;
}

function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[character]);
}
