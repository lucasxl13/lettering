import { t } from "../systems/language.js";
import { AuthRequestError, login } from "../systems/auth.js";
import { registerModal } from "../systems/modal.js";

export function openLoginModal(onLoginSuccess) {
    if (document.querySelector(".login-overlay")) return;

    const overlay = document.createElement("div");
    overlay.className = "login-overlay";
    overlay.innerHTML = `
        <section class="login-card" role="dialog" aria-modal="true" aria-labelledby="login-title">
            <button class="login-close" type="button" aria-label="${t("back")}">×</button>

            <div class="login-avatar" aria-hidden="true">?</div>
            <h2 id="login-title">${t("login")}</h2>
            <p>${t("login_introduction")}</p>

            <form class="login-form" id="login-form">
                <label>
                    <span>${t("email")}</span>
                    <input type="email" id="login-email" autocomplete="email" required>
                </label>

                <label>
                    <span>${t("password")}</span>
                    <input type="password" id="login-password" autocomplete="current-password" required>
                </label>

                <p class="login-message" id="login-message" aria-live="polite"></p>

                <button class="menu_button" type="submit">${t("enter")}</button>
            </form>
        </section>
    `;

    document.body.appendChild(overlay);
    const modal = registerModal(overlay, "login");

    const loginForm = overlay.querySelector("#login-form");
    const emailInput = overlay.querySelector("#login-email");

    overlay.querySelector(".login-close").addEventListener("click", modal.close);
    overlay.addEventListener("click", event => {
        if (event.target === overlay) modal.close();
    });

    emailInput.focus();

    loginForm.addEventListener("submit", async event => {
        event.preventDefault();

        const message = overlay.querySelector("#login-message");
        const submitButton = loginForm.querySelector('[type="submit"]');
        const email = emailInput.value.trim();
        const password = overlay.querySelector("#login-password").value;

        submitButton.disabled = true;
        message.textContent = t("connecting");

        try {
            await login(email, password);
            modal.dismiss();
            onLoginSuccess?.();
        } catch (error) {
            message.textContent = getLoginErrorMessage(error);
            submitButton.disabled = false;
        }
    });
}

function getLoginErrorMessage(error) {
    if (!(error instanceof AuthRequestError)) return t("login_unexpected_error");

    if (error.code === "INVALID_CREDENTIALS") return t("login_invalid_credentials");
    if (error.code === "VALIDATION_ERROR") return t("login_invalid_data");
    if (error.code === "NETWORK_ERROR") return t("server_unavailable");

    return t("login_unexpected_error");
}
