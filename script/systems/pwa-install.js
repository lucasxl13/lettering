let deferredInstallPrompt = null;

window.addEventListener("beforeinstallprompt", event => {
    event.preventDefault();
    deferredInstallPrompt = event;
    window.dispatchEvent(new CustomEvent("lettering-install-state-change"));
});

window.addEventListener("appinstalled", () => {
    deferredInstallPrompt = null;
    window.dispatchEvent(new CustomEvent("lettering-install-state-change"));
});

export function isStandaloneApp() {
    return window.matchMedia("(display-mode: standalone), (display-mode: fullscreen)").matches
        || navigator.standalone === true;
}

export function isAppleMobileDevice() {
    const userAgent = navigator.userAgent ?? "";
    return /iPhone|iPad|iPod/i.test(userAgent)
        || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

export function getPwaInstallState() {
    if (isStandaloneApp()) return "installed";
    if (isAppleMobileDevice()) return "ios";
    if (!window.isSecureContext) return "insecure";
    if (deferredInstallPrompt) return "installable";
    return "instructions";
}

export async function requestPwaInstall() {
    const state = getPwaInstallState();
    if (state !== "installable") return state;

    const prompt = deferredInstallPrompt;
    deferredInstallPrompt = null;
    await prompt.prompt();
    const choice = await prompt.userChoice;
    return choice.outcome === "accepted" ? "accepted" : "dismissed";
}
