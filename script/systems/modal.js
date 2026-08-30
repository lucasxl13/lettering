export function registerModal(overlay, name) {
    let removed = false;

    history.pushState({ letteringModal: name }, "");

    const remove = () => {
        if (removed) return;

        removed = true;
        overlay.remove();
        window.removeEventListener("popstate", handleNativeBack);
        document.removeEventListener("keydown", handleEscape);
    };

    const close = () => {
        if (history.state?.letteringModal === name) {
            history.back();
        } else {
            remove();
        }
    };

    const dismiss = () => {
        const ownsHistoryEntry = history.state?.letteringModal === name;
        remove();

        if (ownsHistoryEntry) history.back();
    };

    function handleNativeBack() {
        remove();
    }

    function handleEscape(event) {
        if (event.key === "Escape") close();
    }

    window.addEventListener("popstate", handleNativeBack);
    document.addEventListener("keydown", handleEscape);

    return { close, dismiss };
}
