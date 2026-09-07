export async function requestMobileFullscreen() {
    if (document.fullscreenElement || document.webkitFullscreenElement) return true;

    const root = document.documentElement;
    const request = root.requestFullscreen
        ?? root.webkitRequestFullscreen
        ?? root.webkitRequestFullScreen;

    if (!request) return false;

    try {
        await request.call(root, { navigationUI: "hide" });
        return true;
    } catch {
        try {
            await request.call(root);
            return true;
        } catch {
            // Safari no iPhone não permite fullscreen de página em uma aba comum.
            return false;
        }
    }
}

export async function exitFullscreen() {
    const exit = document.exitFullscreen
        ?? document.webkitExitFullscreen
        ?? document.webkitCancelFullScreen;

    if (!exit || (!document.fullscreenElement && !document.webkitFullscreenElement)) return true;

    try {
        await exit.call(document);
        return true;
    } catch {
        return false;
    }
}

export function isFullscreen() {
    return Boolean(document.fullscreenElement || document.webkitFullscreenElement);
}
