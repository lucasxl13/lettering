import { t } from "../systems/language.js";
import { THEMES, getTheme, setTheme } from "../systems/theme.js";
import { getVolume, setVolume } from "../systems/audio-settings.js";
import { RADIO_TRACKS, getRadioTrack, setRadioTrack } from "../systems/audio-player.js";
import { registerModal } from "../systems/modal.js";
import { exitFullscreen, isFullscreen, requestMobileFullscreen } from "../systems/fullscreen.js";

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

            <div class="radio-settings">
                <label for="radio-track">${t("radio_title")}</label>
                <div class="radio-controls">
                    <button type="button" class="radio-previous" aria-label="${t("radio_previous")}">&#9664;</button>
                    <select id="radio-track">${RADIO_TRACKS.map(track => `<option value="${track.id}" ${track.id === getRadioTrack().id ? "selected" : ""}>${track.title}</option>`).join("")}</select>
                    <button type="button" class="radio-next" aria-label="${t("radio_next")}">&#9654;</button>
                </div>
                <small class="radio-status" role="status"></small>
            </div>

            <label class="settings-toggle">
                <span>${t("fullscreen_mode")}</span>
                <input class="settings-toggle-input" type="checkbox" ${isFullscreen() ? "checked" : ""}>
                <span class="settings-toggle-track" aria-hidden="true"></span>
            </label>

            <button class="menu_button close-settings">${t("back")}</button>
        </section>
    `;

    document.body.appendChild(overlay);
    const modal = registerModal(overlay, "settings");

    const radio = overlay.querySelector("#radio-track");
    const changeStation = direction => {
        const index = RADIO_TRACKS.findIndex(track => track.id === getRadioTrack().id);
        setRadioTrack(RADIO_TRACKS[(index + direction + RADIO_TRACKS.length) % RADIO_TRACKS.length].id);
    };
    radio.addEventListener("change", () => setRadioTrack(radio.value));
    overlay.querySelector(".radio-previous").addEventListener("click", () => changeStation(-1));
    overlay.querySelector(".radio-next").addEventListener("click", () => changeStation(1));
    window.addEventListener("lettering-radio-change", () => { radio.value = getRadioTrack().id; }, { signal: modal.signal });
    window.addEventListener("lettering-radio-status", event => {
        overlay.querySelector(".radio-status").textContent = event.detail === "error"
            ? t("radio_error")
            : event.detail === "loading" ? t("radio_loading") : "";
    }, { signal: modal.signal });

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

    const fullscreenToggle = overlay.querySelector(".settings-toggle-input");
    const syncFullscreenToggle = () => {
        fullscreenToggle.checked = isFullscreen();
    };

    fullscreenToggle.addEventListener("change", async () => {
        fullscreenToggle.disabled = true;
        if (fullscreenToggle.checked) await requestMobileFullscreen();
        else await exitFullscreen();
        fullscreenToggle.disabled = false;
        syncFullscreenToggle();
    });

    document.addEventListener("fullscreenchange", syncFullscreenToggle, { signal: modal.signal });
    document.addEventListener("webkitfullscreenchange", syncFullscreenToggle, { signal: modal.signal });

    overlay.querySelector(".close-settings").addEventListener("click", modal.close);
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
