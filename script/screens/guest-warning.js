import { t } from "../systems/language.js";
import { registerModal } from "../systems/modal.js";
import { openLoginModal } from "./access.js";

export function openGuestWarning({ onContinue, onLoginSuccess }) {
    if (document.querySelector(".guest-warning-overlay")) return;

    const overlay = document.createElement("div");
    overlay.className = "guest-warning-overlay";
    overlay.innerHTML = `
        <section class="guest-warning-card" role="dialog" aria-modal="true" aria-labelledby="guest-warning-title">
            <h2 id="guest-warning-title">${t("guest_mode_title")}</h2>
            <p>${t("guest_mode_warning")}</p>

            <div class="guest-warning-actions">
                <button class="menu_button" id="continue-as-guest">${t("continue_as_guest")}</button>
                <button class="menu_button" id="login-before-playing">${t("login")}</button>
            </div>
        </section>
    `;

    document.body.appendChild(overlay);
    const modal = registerModal(overlay, "guest-warning");

    overlay.querySelector("#continue-as-guest").addEventListener("click", () => {
        modal.dismiss();
        onContinue();
    });

    overlay.querySelector("#login-before-playing").addEventListener("click", () => {
        modal.dismiss();
        window.setTimeout(() => openLoginModal(onLoginSuccess), 100);
    });

    overlay.addEventListener("click", event => {
        if (event.target === overlay) modal.close();
    });
}
