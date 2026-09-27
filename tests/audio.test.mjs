import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const saved = new Map();
globalThis.localStorage = { getItem: key => saved.get(key) ?? null, setItem: (key, value) => saved.set(key, value) };
globalThis.CustomEvent = class extends Event { constructor(type, options) { super(type); this.detail = options?.detail; } };
globalThis.window = new EventTarget();
globalThis.document = new EventTarget();
globalThis.Audio = class { cloneNode() { return this; } play() { return Promise.resolve(); } };
const sources = [];
const gains = [];
function buffer(channels, length, sampleRate) {
    const data = Array.from({ length: channels }, () => new Float32Array(length));
    return { numberOfChannels: channels, length, sampleRate, getChannelData: c => data[c] };
}
window.AudioContext = class {
    currentTime = 0;
    state = 'running';
    createGain() {
        const gain = { gain: { value: 0, setValueAtTime(v) { this.value = v; }, linearRampToValueAtTime(v) { this.value = v; }, cancelAndHoldAtTime() {}, setTargetAtTime(v) { this.value = v; } }, connect() {}, disconnect() {} };
        gains.push(gain); return gain;
    }
    createBufferSource() {
        const source = { connect() {}, disconnect() {}, start() { this.started = true; }, stop() { this.stopped = true; } };
        sources.push(source); return source;
    }
    createBuffer = buffer;
    decodeAudioData() { return Promise.resolve(buffer(1, 1000, 100)); }
    resume() { return Promise.resolve(); }
};
let pending = [];
globalThis.fetch = path => new Promise(resolve => pending.push({ path, resolve }));
const settings = readFileSync(new URL('../script/systems/audio-settings.js', import.meta.url), 'utf8');
const settingsURL = `data:text/javascript;base64,${Buffer.from(settings).toString('base64')}`;
const source = readFileSync(new URL('../script/systems/audio-player.js', import.meta.url), 'utf8').replace('"./audio-settings.js"', JSON.stringify(settingsURL));
const audio = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
const tick = () => new Promise(resolve => setImmediate(resolve));
const resolveFetch = entry => entry.resolve({ ok: true, arrayBuffer: async () => new ArrayBuffer(0) });

test('imported loop joins its tail to the exact continuing sample of its head', () => {
    const original = buffer(2, 1000, 100);
    for (let c = 0; c < 2; c++) for (let i = 0; i < 1000; i++) original.getChannelData(c)[i] = Math.sin(i * .01) * .2;
    const result = audio.blendLoop(original, { createBuffer: buffer });
    assert.equal(result.length, 875);
    for (let c = 0; c < 2; c++) {
        const data = result.getChannelData(c);
        assert.equal(data[0], original.getChannelData(c)[125]);
        assert.ok(Math.abs(data.at(-1) - data[0]) < .005);
        assert.ok(data.every(Number.isFinite));
    }
});

test('latest station wins pending loads; changes fade old sources; mute persists', async () => {
    audio.installAudio();
    document.dispatchEvent(new Event('pointerdown'));
    audio.setRadioTrack('turbo');
    audio.setRadioTrack('pixel');
    assert.equal(audio.getRadioTrack().id, 'pixel');
    pending.forEach(resolveFetch);
    await tick();
    assert.equal(sources.length, 1);
    assert.equal(sources[0].loop, true);
    const { setVolume } = await import(settingsURL);
    setVolume('music', 0);
    assert.equal(gains[0].gain.value, 0);
    audio.setRadioTrack('turbo');
    await tick();
    assert.equal(sources.length, 2);
    assert.equal(sources[0].stopped, true);
    assert.equal(gains[0].gain.value, 0);
    audio.setRadioTrack('invalid');
    assert.equal(audio.getRadioTrack().id, 'turbo');
});

test('failed station can be retried while current music stays available', async () => {
    audio.setRadioTrack('redline');
    pending.at(-1).resolve({ ok: false });
    await tick();
    assert.equal(sources.at(-1).stopped, undefined);
    audio.setRadioTrack('redline');
    resolveFetch(pending.at(-1));
    await tick();
    assert.equal(sources.length, 3);
});

test('radio translations and generated assets are valid', () => {
    for (const lang of ['pt-BR', 'en-US', 'es-ES']) {
        const translations = JSON.parse(readFileSync(new URL(`../assets/languages/${lang}.json`, import.meta.url), 'utf8'));
        assert.ok(translations.radio_title);
    }
    for (const track of audio.RADIO_TRACKS.filter(track => track.path.endsWith('.wav'))) {
        const wav = readFileSync(new URL('../' + track.path, import.meta.url));
        assert.equal(wav.toString('ascii', 0, 4), 'RIFF');
        assert.ok(Math.abs(wav.readInt16LE(44) - wav.readInt16LE(wav.length - 2)) < 500);
    }
});
