import { t } from "../systems/language.js";
import { THEMES, getTheme, setTheme } from "../systems/theme.js";
import { getVolume, setVolume } from "../systems/audio-settings.js";
import { registerModal } from "../systems/modal.js";

export function openSettings() {
    if (document.querySelector(".settings-overlay")) return;

    const overlay = document.createElement("div");
    overlay.className = "settings-overlay";
    overlay.innerHTML = `
        <section class="settings-panel" role="dialog" aria-modal="true" aria-labelledby="settings-title">
            <h2 id="settings-title">${t("color_palette")}</h2>
            <p>${t("choose_game_appearance")}</p>

            <div class="theme-options">
                ${THEMES.map(createThemeButton).join("")}
            </div>

            <div class="volume-settings">
                ${createVolumeControl("music", t("background_music"))}
                ${createVolumeControl("effects", t("sound_effects"))}
            </div>

            <button class="menu_button close-settings">${t("back")}</button>
        </section>
    `;

    document.body.appendChild(overlay);
    const modal = registerModal(overlay, "settings");

    updateActiveTheme(overlay);

    overlay.querySelectorAll(".theme-option").forEach(button => {
        button.addEventListener("click", () => {
            setTheme(button.dataset.theme);
            updateActiveTheme(overlay);
        });
    });

    overlay.querySelectorAll(".volume-slider").forEach(slider => {
        updateVolumeControl(slider);
        slider.addEventListener("input", () => {
            setVolume(slider.dataset.volumeType, slider.value);
            updateVolumeControl(slider);
        });
    });

    overlay.querySelector(".close-settings").addEventListener("click", modal.close);
    overlay.addEventListener("click", event => {
        if (event.target === overlay) modal.close();
    });
}

function createThemeButton(theme) {
    return `<button class="theme-option" data-theme="${theme.id}">${t(theme.labelKey)}</button>`;
}

function createVolumeControl(type, label) {
    const volume = getVolume(type);

    return `
        <label class="volume-control">
            <span class="volume-label">${label}</span>
            <span class="volume-slider-wrapper">
                <span class="volume-progress" aria-hidden="true"></span>
                <input
                    class="volume-slider"
                    type="range"
                    min="0"
                    max="100"
                    value="${volume}"
                    data-volume-type="${type}"
                    aria-label="${label}"
                >
                <output class="volume-value">${volume}%</output>
            </span>
        </label>
    `;
}

function updateVolumeControl(slider) {
    const wrapper = slider.closest(".volume-slider-wrapper");
    const value = Math.min(100, Math.max(0, Number(slider.value)));

    wrapper.style.setProperty("--volume", `${value}%`);
    wrapper.querySelector(".volume-value").textContent = `${value}%`;
}

function updateActiveTheme(container) {
    const currentTheme = getTheme();

    container.querySelectorAll(".theme-option").forEach(button => {
        const isActive = button.dataset.theme === currentTheme;
        button.classList.toggle("active", isActive);
        button.setAttribute("aria-pressed", String(isActive));
    });
}
