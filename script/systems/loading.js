import { t } from "./language.js";

const buttonStates = new WeakMap();
let activeRequests = 0;
let revealTimer = null;
let statusElement = null;

export function beginNetworkActivity(message = t("loading_action"), { delay = 320 } = {}) {
    activeRequests += 1;
    ensureStatusElement();
    statusElement.querySelector(".network-status-label").textContent = message;

    if (!statusElement.classList.contains("is-visible") && !revealTimer) {
        revealTimer = window.setTimeout(() => {
            revealTimer = null;
            if (activeRequests > 0) statusElement.classList.add("is-visible");
        }, delay);
    }

    let finished = false;
    return () => {
        if (finished) return;
        finished = true;
        activeRequests = Math.max(0, activeRequests - 1);
        if (activeRequests > 0) return;

        if (revealTimer) {
            window.clearTimeout(revealTimer);
            revealTimer = null;
        }
        statusElement?.classList.remove("is-visible");
    };
}

export function setButtonLoading(button, loading, label = t("loading_action")) {
    if (!(button instanceof HTMLButtonElement)) return;

    if (loading) {
        if (buttonStates.has(button)) return;
        buttonStates.set(button, {
            disabled: button.disabled,
            html: button.innerHTML
        });
        button.disabled = true;
        button.classList.add("is-loading");
        button.setAttribute("aria-busy", "true");
        button.innerHTML = `<span class="button-loading-spinner" aria-hidden="true"></span><span>${escapeHtml(label)}</span>`;
        return;
    }

    const state = buttonStates.get(button);
    if (!state) return;
    button.disabled = state.disabled;
    button.innerHTML = state.html;
    button.classList.remove("is-loading");
    button.removeAttribute("aria-busy");
    buttonStates.delete(button);
}

function ensureStatusElement() {
    if (statusElement?.isConnected) return;
    statusElement = document.createElement("div");
    statusElement.className = "network-status";
    statusElement.setAttribute("role", "status");
    statusElement.setAttribute("aria-live", "polite");
    statusElement.innerHTML = `
        <span class="network-status-spinner" aria-hidden="true"></span>
        <span class="network-status-label"></span>
    `;
    document.body.appendChild(statusElement);
}

function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[character]);
}
