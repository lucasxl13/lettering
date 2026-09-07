export function registerModal(overlay, name) {
    let removed = false;
    let interactionStartedOnBackdrop = false;
    const lifecycle = new AbortController();
    const usesMobileNavigation = window.matchMedia("(hover: none) and (pointer: coarse)").matches;

    if (usesMobileNavigation) {
        history.pushState({ letteringModal: name }, "");
    }

    const remove = () => {
        if (removed) return;

        removed = true;
        lifecycle.abort();
        overlay.remove();
        if (usesMobileNavigation) {
            window.removeEventListener("popstate", handleNativeBack);
        }
        overlay.removeEventListener("pointerdown", handleBackdropPointerDown);
        overlay.removeEventListener("pointercancel", resetBackdropInteraction);
        overlay.removeEventListener("click", handleBackdropClick);
        document.removeEventListener("keydown", handleEscape);
    };

    const close = () => {
        if (usesMobileNavigation && history.state?.letteringModal === name) {
            history.back();
        } else {
            remove();
        }
    };

    const dismiss = () => {
        const ownsHistoryEntry = usesMobileNavigation && history.state?.letteringModal === name;
        remove();

        if (ownsHistoryEntry) history.back();
    };

    function handleNativeBack() {
        remove();
    }

    function handleEscape(event) {
        if (event.key === "Escape") close();
    }

    function handleBackdropPointerDown(event) {
        interactionStartedOnBackdrop = event.target === overlay;
    }

    function resetBackdropInteraction() {
        interactionStartedOnBackdrop = false;
    }

    function handleBackdropClick(event) {
        const isBackdropClick = interactionStartedOnBackdrop && event.target === overlay;
        interactionStartedOnBackdrop = false;

        if (isBackdropClick) close();
    }

    if (usesMobileNavigation) {
        window.addEventListener("popstate", handleNativeBack);
    }
    overlay.addEventListener("pointerdown", handleBackdropPointerDown);
    overlay.addEventListener("pointercancel", resetBackdropInteraction);
    overlay.addEventListener("click", handleBackdropClick);
    document.addEventListener("keydown", handleEscape);

    return { close, dismiss, signal: lifecycle.signal };
}
