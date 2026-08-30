const DEFAULT_VOLUMES = {
    music: 70,
    effects: 80
};

export function getVolume(type) {
    const savedValue = localStorage.getItem(`lettering-volume-${type}`);
    const savedVolume = Number(savedValue);

    if (savedValue === null || !Number.isFinite(savedVolume)) {
        return DEFAULT_VOLUMES[type] ?? 100;
    }

    return clampVolume(savedVolume);
}

export function setVolume(type, volume) {
    const numericVolume = Number(volume);
    const safeVolume = Number.isFinite(numericVolume)
        ? clampVolume(numericVolume)
        : DEFAULT_VOLUMES[type] ?? 100;

    localStorage.setItem(`lettering-volume-${type}`, String(safeVolume));
    return safeVolume;
}

function clampVolume(volume) {
    return Math.min(100, Math.max(0, volume));
}
