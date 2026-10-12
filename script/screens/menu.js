import { t, loadLanguage, getLanguage } from "../systems/language.js";
import { getSession, logout } from "../systems/auth.js";
import { openLoginModal } from "./access.js";
import { openSettings } from "./settings.js";
import { loadModes } from "./modes.js";
import { openGuestWarning } from "./guest-warning.js";
import { startGridEffects } from "../systems/grid-effects.js";
import { toRomanLevel } from "../systems/progression-format.js";

const TITLE = "LETTERING";
const LANGUAGES = [
    { code: "pt-BR", flag: "br", label: "Português" },
    { code: "en-US", flag: "us", label: "English" },
    { code: "es-ES", flag: "es", label: "Español" }
];

export function loadMenu() {
    const app = document.getElementById("app");
    const session = getSession();
    const userName = session
        ? session.user?.username || session.user?.email || "Player"
        : "";

    app.innerHTML = `
        <main class="menu">
            <div class="title">
                ${[...TITLE].map(letter => `<div class="letter-block">${letter}</div>`).join("")}
            </div>

            ${createAccountCard(session, userName)}

            <button class="menu_button" id="play-button">${t("play")}</button>
            <button class="menu_button" id="settings-button">${t("settings")}</button>
            <button class="menu_button" id="credits-button">${t("credits")}</button>
            <button class="menu_button" id="help-button">${t("help")}</button>

            <div class="languages">
                ${LANGUAGES.map(createLanguageButton).join("")}
            </div>
        </main>
    `;

    setupTitleAnimation(() => startGridEffects(document.querySelector(".menu")));
    setupLanguageButtons();
    document.getElementById("play-button").addEventListener("click", () => {
        if (session) {
            loadModes(loadMenu);
            return;
        }

        openGuestWarning({
            onContinue: () => loadModes(loadMenu),
            onLoginSuccess: () => loadModes(loadMenu)
        });
    });
    document.getElementById("settings-button").addEventListener("click", openSettings);

    if (session) {
        document.getElementById("logout-button").addEventListener("click", async () => {
            await logout();
            loadMenu();
        });
    } else {
        document.getElementById("login-from-menu-button").addEventListener("click", () => {
            openLoginModal(loadMenu);
        });
    }
}

function createAccountCard(session, userName) {
    if (!session) {
        return `
            <div class="account-card">
                <div class="user-avatar" aria-hidden="true">?</div>
                <div class="user-details">
                    <strong>${t("guest")}</strong>
                </div>
                <button id="login-from-menu-button">${t("login")}</button>
            </div>
        `;
    }

    const safeName = escapeHtml(userName);
    const initial = escapeHtml(userName.trim().charAt(0).toUpperCase() || "U");
    const progression = normalizeProgression(session.user?.progression);
    const progress = Math.min(
        100,
        Math.max(0, progression.currentLevelXp / progression.xpForNextLevel * 100)
    );
    const romanLevel = toRomanLevel(progression.level);
    const progressPercentage = formatProgressPercentage(progress);
    const prestige = progression.prestige > 0
        ? `<span class="prestige-badge" title="${t("prestige")}">✦${progression.prestige}</span>`
        : "";

    return `
        <div class="account-card">
            <div class="user-avatar" aria-hidden="true">${initial}</div>
            <div class="user-details">
                <div class="user-name-row">
                    <div class="user-identity">
                        <strong>${safeName}</strong>
                        ${prestige}
                    </div>
                </div>
                <div class="level-progress-wrap">
                    <div
                        class="level-progress"
                        role="progressbar"
                        aria-label="${t("level")} ${progression.level}: ${progression.currentLevelXp}/${progression.xpForNextLevel} XP"
                        aria-valuemin="0"
                        aria-valuemax="${progression.xpForNextLevel}"
                        aria-valuenow="${progression.currentLevelXp}"
                    >
                        <span class="level-progress-fill" style="width: ${progress}%"></span>
                        <span class="level-progress-label" aria-hidden="true">${romanLevel} (${progressPercentage}%)</span>
                    </div>
                </div>
            </div>
            <button id="logout-button">${t("logout")}</button>
        </div>
    `;
}

function formatProgressPercentage(value) {
    return new Intl.NumberFormat(getLanguage(), {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
    }).format(value);
}

function normalizeProgression(value) {
    const level = Math.max(1, Math.floor(Number(value?.level) || 1));
    const xpForNextLevel = Math.max(1, Math.floor(Number(value?.xpForNextLevel) || 100));
    return {
        level,
        currentLevelXp: Math.min(
            xpForNextLevel,
            Math.max(0, Math.floor(Number(value?.currentLevelXp) || 0))
        ),
        xpForNextLevel,
        prestige: Math.max(0, Math.floor(Number(value?.prestige) || 0))
    };
}

function createLanguageButton(language) {
    const isActive = getLanguage() === language.code;

    return `
        <img
            class="flag ${isActive ? "active" : ""}"
            src="assets/sprites/flags/${language.flag}.svg"
            data-language="${language.code}"
            alt="${language.label}"
        >
    `;
}

function setupTitleAnimation(onComplete) {
    const blocks = [...document.querySelectorAll(".letter-block")];
    const lastBlock = blocks.at(-1);
    const title = document.querySelector(".title");

    lastBlock?.addEventListener("animationend", event => {
        if (event.animationName === "blockFall") {
            title?.classList.add("complete");
        }
    });

    const handleTitleComplete = event => {
        if (event.animationName !== "lightUp" || event.target !== lastBlock) return;

        title.removeEventListener("animationend", handleTitleComplete);
        onComplete?.();
    };

    title?.addEventListener("animationend", handleTitleComplete);
}

function setupLanguageButtons() {
    document.querySelectorAll(".languages img").forEach(flag => {
        flag.addEventListener("click", async () => {
            await loadLanguage(flag.dataset.language);
            loadMenu();
        });
    });
}

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}
