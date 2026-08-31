import { t, loadLanguage, getLanguage } from "../systems/language.js";
import { getSession, logout } from "../systems/auth.js";
import { openLoginModal } from "./access.js";
import { openSettings } from "./settings.js";
import { loadModes } from "./modes.js";
import { openGuestWarning } from "./guest-warning.js";
import { startGridEffects } from "../systems/grid-effects.js";

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

    return `
        <div class="account-card">
            <div class="user-avatar" aria-hidden="true">${initial}</div>
            <div class="user-details">
                <strong>${safeName}</strong>
            </div>
            <button id="logout-button">${t("logout")}</button>
        </div>
    `;
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
