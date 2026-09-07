import { t } from "../systems/language.js";
import { AuthRequestError, checkAvailability, login, register } from "../systems/auth.js";
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
                <label class="register-only hidden">
                    <input type="text" id="register-username" autocomplete="username" minlength="3" maxlength="30" pattern="[A-Za-z0-9_]+" placeholder="${t("username")}" aria-label="${t("username")}">
                    <small class="field-feedback" id="username-availability" aria-live="polite"></small>
                </label>

                <label>
                    <input type="email" id="login-email" autocomplete="email" required placeholder="${t("email")}" aria-label="${t("email")}">
                    <small class="field-feedback" id="email-availability" aria-live="polite"></small>
                </label>

                <label>
                    <input type="password" id="login-password" autocomplete="current-password" required placeholder="${t("password")}" aria-label="${t("password")}">
                    <small class="field-feedback" id="password-status" aria-live="polite"></small>
                </label>

                <button class="menu_button" type="submit">${t("enter")}</button>
            </form>

            <div class="access-switch">
                <span id="access-mode-prompt">${t("no_account")}</span>
                <button class="access-mode-toggle" id="access-mode-toggle" type="button">
                    ${t("register")}
                </button>
            </div>

            <button class="forgot-password-button" id="forgot-password-button" type="button">
                ${t("forgot_password")}
            </button>
        </section>
    `;

    document.body.appendChild(overlay);
    const modal = registerModal(overlay, "login");

    const loginForm = overlay.querySelector("#login-form");
    const emailInput = overlay.querySelector("#login-email");
    const usernameInput = overlay.querySelector("#register-username");
    const passwordInput = overlay.querySelector("#login-password");
    const title = overlay.querySelector("#login-title");
    const introduction = overlay.querySelector(".login-card > p");
    const submitButton = loginForm.querySelector('[type="submit"]');
    const modeToggle = overlay.querySelector("#access-mode-toggle");
    const modePrompt = overlay.querySelector("#access-mode-prompt");
    const forgotPasswordButton = overlay.querySelector("#forgot-password-button");
    const usernameAvailability = overlay.querySelector("#username-availability");
    const emailAvailability = overlay.querySelector("#email-availability");
    const passwordStatus = overlay.querySelector("#password-status");
    const availabilityRequestIds = { username: 0, email: 0 };
    const availabilityTimers = { username: null, email: null };
    let isRegisterMode = false;

    overlay.querySelector(".login-close").addEventListener("click", modal.close);

    emailInput.focus();

    modeToggle.addEventListener("click", () => {
        availabilityRequestIds.username += 1;
        availabilityRequestIds.email += 1;
        clearTimeout(availabilityTimers.username);
        clearTimeout(availabilityTimers.email);
        loginForm.reset();
        clearAvailability(usernameInput, usernameAvailability);
        clearAvailability(emailInput, emailAvailability);
        clearAvailability(passwordInput, passwordStatus);

        isRegisterMode = !isRegisterMode;
        overlay.querySelectorAll(".register-only").forEach(element => {
            element.classList.toggle("hidden", !isRegisterMode);
        });
        usernameInput.required = isRegisterMode;
        passwordInput.minLength = isRegisterMode ? 8 : 1;
        passwordInput.autocomplete = isRegisterMode ? "new-password" : "current-password";
        title.textContent = t(isRegisterMode ? "register" : "login");
        introduction.textContent = t(isRegisterMode ? "register_introduction" : "login_introduction");
        submitButton.textContent = t(isRegisterMode ? "register" : "enter");
        modePrompt.textContent = t(isRegisterMode ? "already_have_account" : "no_account");
        modeToggle.textContent = t(isRegisterMode ? "login" : "register");
        forgotPasswordButton.classList.toggle("hidden", isRegisterMode);
        (isRegisterMode ? usernameInput : emailInput).focus();
    });

    forgotPasswordButton.addEventListener("click", () => {
        setFieldError(passwordInput, passwordStatus, t("password_recovery_unavailable_short"));
        passwordInput.focus();
    });

    usernameInput.addEventListener("blur", () => {
        if (isRegisterMode) validateAvailabilityNow("username", usernameInput, usernameAvailability);
    });
    emailInput.addEventListener("blur", () => {
        if (isRegisterMode) validateAvailabilityNow("email", emailInput, emailAvailability);
    });
    usernameInput.addEventListener("input", () => {
        scheduleAvailabilityCheck("username", usernameInput, usernameAvailability);
    });
    emailInput.addEventListener("input", () => {
        scheduleAvailabilityCheck("email", emailInput, emailAvailability);
    });
    passwordInput.addEventListener("input", () => clearAvailability(passwordInput, passwordStatus));

    emailInput.addEventListener("focus", () => {
        if (!isRegisterMode) clearLoginErrors();
    });
    passwordInput.addEventListener("focus", () => {
        if (!isRegisterMode) clearLoginErrors();
    });

    loginForm.addEventListener("submit", async event => {
        event.preventDefault();

        const email = emailInput.value.trim();
        const password = passwordInput.value;
        const idleButtonText = t(isRegisterMode ? "register" : "enter");

        if (!isRegisterMode) {
            clearAvailability(emailInput, emailAvailability);
            clearAvailability(passwordInput, passwordStatus);
            document.activeElement?.blur();
        }

        if (isRegisterMode) {
            const invalidRegistrationField = getInvalidRegistrationField();
            if (invalidRegistrationField) {
                showRegistrationFieldError(invalidRegistrationField);
                return;
            }

            const unavailableInput = [usernameInput, emailInput]
                .find(input => input.dataset.availability === "unavailable");
            if (unavailableInput) {
                return;
            }
        }

        submitButton.disabled = true;
        submitButton.textContent = t("connecting");

        try {
            if (isRegisterMode) {
                await register(usernameInput.value.trim(), email, password);
            } else {
                await login(email, password);
            }
            modal.dismiss();
            onLoginSuccess?.();
        } catch (error) {
            showAuthError(error, isRegisterMode);
            submitButton.disabled = false;
            submitButton.textContent = idleButtonText;
        }
    });

    function scheduleAvailabilityCheck(field, input, indicator) {
        availabilityRequestIds[field] += 1;
        clearTimeout(availabilityTimers[field]);
        clearAvailability(input, indicator);

        if (!isRegisterMode || !input.value.trim() || !input.checkValidity()) return;

        availabilityTimers[field] = setTimeout(() => {
            validateAvailability(field, input, indicator);
        }, 600);
    }

    function validateAvailabilityNow(field, input, indicator) {
        clearTimeout(availabilityTimers[field]);
        if (input.dataset.availabilityValue === input.value.trim()) return;
        validateAvailability(field, input, indicator);
    }

    async function validateAvailability(field, input, indicator) {
        const value = input.value.trim();
        if (!value || !input.checkValidity()) {
            clearAvailability(input, indicator);
            return;
        }

        const requestId = ++availabilityRequestIds[field];
        input.dataset.availabilityValue = value;

        try {
            const result = await checkAvailability(field, value);
            if (requestId !== availabilityRequestIds[field] || input.value.trim() !== value) return;

            if (result.available) {
                clearAvailability(input, indicator);
                input.dataset.availabilityValue = value;
                return;
            }

            setAvailability(input, indicator, "unavailable", "×", t(`${field}_unavailable`));
        } catch {
            if (requestId !== availabilityRequestIds[field]) return;
            clearAvailability(input, indicator);
        }
    }

    function showAuthError(error, registering) {
        if (!(error instanceof AuthRequestError)) {
            if (registering) emailInput.focus();
            setFieldError(emailInput, emailAvailability, t("login_unexpected_error_short"));
            return;
        }

        if (error.code === "EMAIL_ALREADY_IN_USE") {
            setFieldError(emailInput, emailAvailability, t("email_unavailable"));
            return;
        }
        if (error.code === "USERNAME_ALREADY_IN_USE") {
            setFieldError(usernameInput, usernameAvailability, t("username_unavailable"));
            return;
        }
        if (error.code === "USER_ALREADY_EXISTS") {
            setFieldError(emailInput, emailAvailability, t("email_or_username_unavailable"));
            return;
        }
        if (error.code === "INVALID_CREDENTIALS") {
            markFieldError(emailInput, emailAvailability);
            setFieldError(passwordInput, passwordStatus, t("invalid_credentials_clear"));
            return;
        }
        if (error.code === "VALIDATION_ERROR") {
            if (!registering) {
                markFieldError(emailInput, emailAvailability);
                setFieldError(passwordInput, passwordStatus, t("invalid_credentials_clear"));
                return;
            }

            const fieldErrors = error.details?.fieldErrors ?? {};
            const invalidField = ["username", "email", "password"]
                .find(field => fieldErrors[field]?.length);
            showRegistrationFieldError(invalidField ?? getInvalidRegistrationField() ?? "username");
            return;
        }

        if (registering) emailInput.focus();
        setFieldError(emailInput, emailAvailability, t(
            error.code === "NETWORK_ERROR" ? "server_unavailable_short" : "login_unexpected_error_short"
        ));
    }

    function clearLoginErrors() {
        clearAvailability(emailInput, emailAvailability);
        clearAvailability(passwordInput, passwordStatus);
    }

    function getInvalidRegistrationField() {
        if (!usernameInput.checkValidity()) return "username";
        if (!emailInput.checkValidity()) return "email";
        if (!passwordInput.checkValidity()) return "password";
        return null;
    }

    function showRegistrationFieldError(field) {
        const fields = {
            username: [usernameInput, usernameAvailability, "registration_username_invalid"],
            email: [emailInput, emailAvailability, "registration_email_invalid"],
            password: [passwordInput, passwordStatus, "registration_password_invalid"]
        };
        const [input, indicator, translationKey] = fields[field];
        input.focus();
        setFieldError(input, indicator, t(translationKey));
    }

}

function setAvailability(input, indicator, state, symbol, description) {
    input.dataset.availability = state;
    indicator.dataset.state = state;
    indicator.textContent = description ? `${symbol} ${description}` : symbol;
    indicator.title = description;
    indicator.setAttribute("aria-label", description);
}

function setFieldError(input, indicator, description) {
    setAvailability(input, indicator, "unavailable", "×", description);
}

function markFieldError(input, indicator) {
    input.dataset.availability = "invalid";
    delete indicator.dataset.state;
    indicator.textContent = "";
}

function clearAvailability(input, indicator) {
    delete input.dataset.availability;
    delete input.dataset.availabilityValue;
    delete indicator.dataset.state;
    indicator.textContent = "";
    indicator.removeAttribute("title");
    indicator.removeAttribute("aria-label");
}
