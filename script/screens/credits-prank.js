import { t } from "../systems/language.js";

// Pegadinha: antes dos créditos de verdade, finge que o servidor caiu.
// O "stack trace" é, na verdade, a lista de créditos disfarçada.
const STACK = [
    "Error: CreditsOverflowException: too much talent to render",
    "    at renderDevelopers (credits.js:4:23)",
    "    at LucasHatzCardoso (talent.js:999:1)",
    "    at PedroBigai (talent.js:999:2)",
    "    at Empacotatron [Fupi] (music.ogg:1:1)",
    "    at InterfaceSounds [Kenney] (sfx.ogg:1:1)",
    "    at async openCredits (credits.js:12:1)"
];

const randomHex = length => Array.from(crypto.getRandomValues(new Uint8Array(length / 2)))
    .map(byte => byte.toString(16).padStart(2, "0")).join("");

export function showCreditsPrank(onReveal) {
    if (document.querySelector(".fake-error")) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const overlay = document.createElement("div");
    overlay.className = "fake-error";
    overlay.setAttribute("role", "alertdialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-labelledby", "fake-error-title");
    overlay.innerHTML = `
        <main class="fake-error-page">
            <h1 id="fake-error-title">500 Internal Server Error</h1>
            <p>The server encountered an unexpected condition that prevented it from fulfilling the request.</p>
            <pre class="fake-error-stack" aria-live="polite"></pre>
            <p class="fake-error-meta">Request ID: ${randomHex(16)} · ${new Date().toISOString()}</p>
            <button type="button" class="fake-error-retry">Try again</button>
            <hr>
            <p class="fake-error-footer">lettering-api/2.0.1</p>
        </main>
        <div class="fake-error-reveal" hidden>
            <strong>${t("credits_prank_title")}</strong>
            <span>${t("credits_prank_subtitle")}</span>
        </div>
    `;
    document.body.appendChild(overlay);

    const stack = overlay.querySelector(".fake-error-stack");
    const retry = overlay.querySelector(".fake-error-retry");
    const timers = [];
    let finished = false;

    const later = (fn, ms) => timers.push(setTimeout(fn, reducedMotion ? 0 : ms));

    STACK.forEach((line, index) => later(() => { stack.textContent += `${line}\n`; }, 350 + index * 180));
    later(() => retry.focus(), 400);

    const finish = () => {
        if (finished) return;
        finished = true;
        timers.forEach(clearTimeout);
        document.removeEventListener("keydown", handleKey);
        overlay.remove();
        onReveal();
    };

    const reveal = () => {
        retry.disabled = true;
        retry.textContent = "Retrying…";
        later(() => {
            overlay.classList.add("is-glitching");
            later(() => {
                overlay.classList.add("is-revealed");
                overlay.querySelector(".fake-error-reveal").hidden = false;
                later(finish, 1600);
            }, 450);
        }, 900);
    };

    function handleKey(event) {
        if (event.key === "Escape") finish();
    }

    retry.addEventListener("click", reveal);
    document.addEventListener("keydown", handleKey);
}
