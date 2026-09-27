import { getVolume } from "./audio-settings.js";

export const RADIO_TRACKS = [
    { id: "puzzle", title: "Empacotatron", path: "assets/audio/music/puzzle-loop.ogg", blend: true },
    { id: "pixel", title: "Pixel Drift", path: "assets/audio/music/pixel-drift.wav" },
    { id: "turbo", title: "Turbo Rush", path: "assets/audio/music/turbo-rush.wav" },
    { id: "redline", title: "Redline", path: "assets/audio/music/redline.wav" }
];
export function getRadioTrack() {
    return RADIO_TRACKS.find(track => track.id === localStorage.getItem("lettering-radio")) || RADIO_TRACKS[0];
}
export function setRadioTrack(id) {
    const track = RADIO_TRACKS.find(track => track.id === id);
    if (!track) return;
    localStorage.setItem("lettering-radio", id);
    window.dispatchEvent(new CustomEvent("lettering-radio-change"));
    if (context) { void context.resume().catch(() => {}); void startTrack(); }
}

const EFFECT_PATHS = {
    confirm: "assets/audio/sfx/ui-confirm.ogg",
    select: "assets/audio/sfx/ui-select.ogg",
    drop: "assets/audio/sfx/letter-drop.ogg",
    word: "assets/audio/sfx/word-found.ogg",
    life: "assets/audio/sfx/life-lost.ogg",
    match: "assets/audio/sfx/match-found.ogg",
    victory: "assets/audio/sfx/victory.ogg",
    defeat: "assets/audio/sfx/final-defeat.wav"
};

const effectTemplates = new Map();
const buffers = new Map();
let context;
let master;
let current;
let request = 0;
let started = false;

export function installAudio() {
    if (started) return;
    started = true;
    Object.entries(EFFECT_PATHS).forEach(([name, path]) => {
        const audio = new Audio(path);
        audio.preload = "auto";
        effectTemplates.set(name, audio);
    });
    const beginMusic = () => {
        if (!context) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) return;
            context = new AudioContext();
            master = context.createGain();
            master.gain.value = getVolume("music") / 100 * .42;
            master.connect(context.destination);
            void startTrack();
        }
        if (context.state !== "running") void context.resume().catch(() => {});
    };
    document.addEventListener("pointerdown", beginMusic);
    document.addEventListener("keydown", beginMusic);
    document.addEventListener("click", event => {
        if (event.target instanceof Element && event.target.closest("button:not(:disabled), [role='button']")) playEffect("confirm", .42);
    });
    window.addEventListener("lettering-volume-change", event => {
        if (event.detail?.type !== "music" || !master) return;
        master.gain.setTargetAtTime(getVolume("music") / 100 * .42, context.currentTime, .025);
    });
}

export function playEffect(name, strength = 1) {
    const template = effectTemplates.get(name);
    const volume = getVolume("effects") / 100 * strength;
    if (!template || volume <= 0) return;
    const sound = template.cloneNode();
    sound.volume = Math.min(1, volume);
    void sound.play().catch(() => {});
}

// Bake an overlap into imported music. AudioBufferSource then loops on the
// audio clock, without timeupdate / animation-frame gaps in background tabs.
export function blendLoop(buffer, audioContext) {
    const overlap = Math.min(Math.round(buffer.sampleRate * 1.25), Math.floor(buffer.length / 4));
    const length = buffer.length - overlap;
    const result = audioContext.createBuffer(buffer.numberOfChannels, length, buffer.sampleRate);
    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
        const input = buffer.getChannelData(channel);
        const output = result.getChannelData(channel);
        output.set(input.subarray(overlap, length));
        for (let i = 0; i < overlap; i++) {
            const mix = i / overlap;
            output[length - overlap + i] = input[length + i] * Math.cos(mix * Math.PI / 2)
                + input[i] * Math.sin(mix * Math.PI / 2);
        }
    }
    return result;
}

async function loadTrack(track) {
    if (!buffers.has(track.id)) {
        const pending = (async () => {
            const response = await fetch(track.path);
            if (!response.ok) throw new Error("Music unavailable");
            const decoded = await context.decodeAudioData(await response.arrayBuffer());
            return track.blend ? blendLoop(decoded, context) : decoded;
        })();
        buffers.set(track.id, pending);
        pending.catch(() => buffers.delete(track.id));
    }
    return buffers.get(track.id);
}

async function startTrack() {
    const token = ++request;
    const track = getRadioTrack();
    window.dispatchEvent(new CustomEvent("lettering-radio-status", { detail: "loading" }));
    try {
        const buffer = await loadTrack(track);
        if (token !== request) return;
        const source = context.createBufferSource();
        const gain = context.createGain();
        source.buffer = buffer;
        source.loop = true;
        source.connect(gain);
        gain.connect(master);
        const now = context.currentTime;
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(1, now + .6);
        source.start(now);
        if (current) {
            const previous = current;
            previous.gain.gain.cancelAndHoldAtTime(now);
            previous.gain.gain.linearRampToValueAtTime(0, now + .6);
            previous.source.stop(now + .65);
        }
        current = { source, gain };
        source.onended = () => { source.disconnect(); gain.disconnect(); };
        window.dispatchEvent(new CustomEvent("lettering-radio-status", { detail: "playing" }));
    } catch {
        if (token === request) window.dispatchEvent(new CustomEvent("lettering-radio-status", { detail: "error" }));
    }
}
