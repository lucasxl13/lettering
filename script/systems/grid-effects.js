const GRID_EFFECTS = ["center-out", "down", "up", "right", "left"];

export function startGridEffects(container) {
    if (!container) return;

    let effectIndex = 0;

    const playNextEffect = () => {
        if (!container.isConnected) return;

        container.dataset.gridEffect = GRID_EFFECTS[effectIndex];
        effectIndex = (effectIndex + 1) % GRID_EFFECTS.length;
    };

    container.addEventListener("animationend", event => {
        if (event.pseudoElement !== "::after") return;

        delete container.dataset.gridEffect;
        window.setTimeout(playNextEffect, 250);
    });

    playNextEffect();
}
