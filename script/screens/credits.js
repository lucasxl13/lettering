import { t } from "../systems/language.js";
import { registerModal } from "../systems/modal.js";

const DEVELOPERS = ["Lucas Hatz Cardoso", "Pedro Bigai"];

// Mesmas fontes registradas em assets/audio/LICENSES.md.
const AUDIO_CREDITS = [
    { work: "Empacotatron", author: "Fupi", url: "https://opengameart.org/content/empacotatron", kind: "credits_music" },
    { work: "Interface Sounds", author: "Kenney", url: "https://kenney.nl/assets/interface-sounds", kind: "credits_sfx" }
];

export function openCredits() {
    if (document.querySelector(".credits-overlay")) return;

    const overlay = document.createElement("div");
    overlay.className = "settings-overlay credits-overlay";
    overlay.innerHTML = `
        <section class="pwa-install-panel credits-panel" role="dialog" aria-modal="true" aria-labelledby="credits-title">
            <h2 id="credits-title">${t("credits")}</h2>
            <p>${t("credits_description")}</p>

            <div class="credits-section">
                <h3>${t("credits_development")}</h3>
                <ul>${DEVELOPERS.map(name => `<li>${name}</li>`).join("")}</ul>
            </div>

            <div class="credits-section">
                <h3>${t("credits_audio")}</h3>
                <ul>
                    ${AUDIO_CREDITS.map(item => `
                        <li>
                            <a href="${item.url}" target="_blank" rel="noopener noreferrer">${item.work}</a>
                            — ${item.author} <small>(${t(item.kind)}, CC0)</small>
                        </li>
                    `).join("")}
                    <li>${t("credits_original_audio")}</li>
                </ul>
            </div>

            <button type="button" class="menu_button pwa-install-close credits-close">${t("back")}</button>
        </section>
    `;

    document.body.appendChild(overlay);
    const modal = registerModal(overlay, "credits");
    overlay.querySelector(".credits-close").addEventListener("click", modal.close);
}
