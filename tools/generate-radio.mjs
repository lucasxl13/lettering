// Original synthesized music. Run with node tools/generate-radio.mjs.
import { writeFileSync } from 'node:fs';

const rate = 22050;
const tau = Math.PI * 2;
const hz = midi => 440 * 2 ** ((midi - 69) / 12);

function save(path, samples) {
    const seam = 256;
    for (let i = 0; i < seam; i++) {
        const mix = i / (seam - 1);
        const index = samples.length - seam + i;
        samples[index] = samples[index] * (1 - mix) + samples[0] * mix;
    }
    const bytes = Buffer.alloc(44 + samples.length * 2);
    bytes.write('RIFF'); bytes.writeUInt32LE(bytes.length - 8, 4); bytes.write('WAVEfmt ', 8);
    bytes.writeUInt32LE(16, 16); bytes.writeUInt16LE(1, 20); bytes.writeUInt16LE(1, 22);
    bytes.writeUInt32LE(rate, 24); bytes.writeUInt32LE(rate * 2, 28);
    bytes.writeUInt16LE(2, 32); bytes.writeUInt16LE(16, 34); bytes.write('data', 36);
    bytes.writeUInt32LE(samples.length * 2, 40);
    const peak = Math.max(.8, samples.reduce((max, value) => Math.max(max, Math.abs(value)), 0));
    samples.forEach((value, index) => bytes.writeInt16LE(Math.round(value / peak * 26000), 44 + index * 2));
    writeFileSync(new URL('../assets/audio/' + path, import.meta.url), bytes);
}

function createSong(beats, bpm) {
    const beat = 60 / bpm;
    const samples = new Float32Array(Math.round(beats * beat * rate));
    const add = (startBeat, durationBeats, midi, gain, voice = 'sine') => {
        const start = Math.round(startBeat * beat * rate);
        const duration = durationBeats * beat;
        const frequency = hz(midi);
        for (let i = 0; i < duration * rate; i++) {
            const t = i / rate;
            const phase = tau * frequency * t;
            const attack = Math.min(1, t / (voice === 'pad' ? .18 : .012));
            const release = Math.min(1, (duration - t) / (voice === 'pad' ? .55 : .08));
            let tone = Math.sin(phase);
            if (voice === 'bell') tone += .38 * Math.sin(phase * 2) + .14 * Math.sin(phase * 3);
            if (voice === 'saw') tone = 2 * ((frequency * t) % 1) - 1;
            if (voice === 'bass') tone += .3 * Math.sin(phase / 2);
            samples[(start + i) % samples.length] += tone * gain * attack * Math.max(0, release);
        }
    };
    const kick = startBeat => {
        const start = Math.round(startBeat * beat * rate);
        for (let i = 0; i < .18 * rate; i++) {
            const t = i / rate;
            const phase = tau * (48 * t + 100 * .035 * (1 - Math.exp(-t / .035)));
            samples[(start + i) % samples.length] += Math.sin(phase) * .3 * Math.exp(-t * 22);
        }
    };
    const noise = (startBeat, duration = .055, gain = .06) => {
        const start = Math.round(startBeat * beat * rate);
        let random = 17;
        for (let i = 0; i < duration * rate; i++) {
            random = (random * 16807) % 2147483647;
            samples[(start + i) % samples.length] += (random / 1073741824 - 1) * gain * Math.exp(-i / rate * 35);
        }
    };
    return { samples, add, kick, noise };
}

function pixelDrift() {
    const song = createSong(64, 112);
    const roots = [50, 46, 53, 48];
    const pattern = [0, 7, 12, 10, 7, 3, 10, 7];
    for (let b = 0; b < 64; b++) {
        const section = Math.floor(b / 16);
        const root = roots[Math.floor(b / 4) % roots.length];
        if (b % 4 === 0) {
            const intervals = section === 2 ? [0, 5, 7, 12] : [0, 3, 7, 10];
            intervals.forEach((interval, index) => song.add(b, 5, root + 12 + interval, index === 3 ? .045 : .065, 'pad'));
        }
        // The bridge thins out the bass before the final section returns.
        if (section !== 2 || b % 2 === 0) song.add(b, section === 2 ? 1.5 : .85, root - 12 + (section === 3 && b % 4 === 3 ? 7 : 0), .2, 'bass');
        for (let step = 0; step < 2; step++) {
            if (section === 2 && b % 4 === 3 && step === 1) continue;
            const answer = section === 1 ? (step ? 5 : 0) : section === 3 ? 5 : 0;
            song.add(b + step / 2, section === 2 ? .7 : 1.4, root + 24 + pattern[(b * 2 + step) % 8] + answer, .085, 'bell');
        }
        // A small counter-melody appears only on the second and fourth passes.
        if ((section === 1 || section === 3) && b % 4 === 2) {
            const counterOctave = section === 3 ? 29 : 36;
            [0, 3, 7].forEach((interval, index) => song.add(b + index / 3, .28, root + counterOctave + interval, section === 3 ? .032 : .045, 'sine'));
        }
        song.kick(b);
        if (section !== 2 || b % 2 === 0) song.noise(b + .5, .03, .025);
    }
    save('music/pixel-drift.wav', song.samples);
}

function turboRush() {
    const song = createSong(64, 154);
    const roots = [52, 55, 48, 50];
    const melody = [0, 4, 7, 12, 11, 7, 4, 14, 12, 7, 16, 14, 11, 7, 4, 2];
    for (let b = 0; b < 64; b++) {
        const section = Math.floor(b / 16);
        const root = roots[Math.floor(b / 4) % 4];
        for (let step = 0; step < 4; step++) {
            // Section three drops to a syncopated half-time phrase; the last
            // section comes back one octave higher with an altered ending.
            if (section === 2 && step % 2) continue;
            const phraseEnd = section === 3 && b % 4 === 3 ? [0, 2, 7, 11][step] : 0;
            const octave = section === 1 && step >= 2 ? -12 : section === 3 ? 12 : 0;
            song.add(b + step / 4, section === 2 ? .46 : .22, root + 12 + melody[(b * 4 + step) % melody.length] + octave + phraseEnd, section === 2 ? .13 : .105, 'bell');
        }
        song.add(b, section === 2 ? .9 : .42, root - 12 + (b % 2 ? 7 : 0), section === 2 ? .26 : .22, 'bass');
        if (b % 4 === 0 && section > 0) [0, 4, 7].forEach(interval => song.add(b, section === 2 ? 3.5 : 1.2, root + interval, .05, 'pad'));
        song.kick(b);
        if (section !== 2) song.kick(b + .5);
        song.noise(b + (section === 2 ? .5 : .25), .035, .055);
        if (section !== 2) song.noise(b + .75, .035, section === 3 ? .08 : .055);
    }
    [64, 67, 71, 76, 79, 83].forEach((note, index) => song.add(62.5 + index / 4, .2, note, .12, 'bell'));
    save('music/turbo-rush.wav', song.samples);
}

function redline() {
    const song = createSong(64, 136);
    const riff = [40, 40, 43, 41, 40, 46, 45, 41, 40, 40, 48, 46, 43, 41, 39, 40];
    for (let b = 0; b < 64; b++) {
        const section = Math.floor(b / 16);
        for (let step = 0; step < 4; step++) {
            // The second half answers the main riff an octave higher and the
            // last section leaves small gaps before the final build.
            if (section === 3 && b < 60 && step === 2) continue;
            const variation = section === 1 ? [0, 0, 3, 5][step] : section === 2 ? 12 : 0;
            const note = riff[(b * 4 + step) % riff.length] + variation;
            song.add(b + step / 4, section === 2 ? .16 : .2, note, section === 2 ? .18 : .24, 'saw');
            if (step === 0 || (section !== 3 && step === 3)) song.add(b + step / 4, .18, note + 12, .08, 'saw');
        }
        if (b % 4 === 0) {
            const chordRoot = [52, 55, 48, 51][section];
            [0, section === 3 ? 3 : 1, 7].forEach(interval => song.add(b, 1.75, chordRoot + interval, .055, 'saw'));
        }
        song.kick(b); song.kick(b + .5);
        song.noise(b + .5, .12, .14); song.noise(b + .75, .035, .06);
    }

    // This unresolved chord starts before the end and wraps around the audio
    // buffer. Its release is heard after the main riff begins again.
    [40, 47, 52, 55, 58].forEach((note, index) => {
        song.add(61.5, 5.5, note, index === 0 ? .14 : .075, index === 0 ? 'bass' : 'saw');
    });
    // Rising fill into the boundary, followed by the wrapped chord tail.
    [52, 55, 58, 61, 64, 67].forEach((note, index) => song.add(62.5 + index / 4, .22, note, .11, 'saw'));
    save('music/redline.wav', song.samples);
}

pixelDrift(); turboRush(); redline();

const defeat = new Float32Array(rate * 3);
for (let i = 0; i < defeat.length; i++) {
    const t = i / rate;
    const attack = Math.min(1, t / .012);
    const tail = Math.exp(-t * 1.8) * Math.min(1, (3 - t) / .3);
    const fall = tau * (95 * t + 150 * .23 * (1 - Math.exp(-t / .23)));
    defeat[i] = attack * tail * (.42 * Math.sin(fall) + .18 * Math.sin(tau * 48 * t));
    for (const [delay, frequency] of [[.05, 311.13], [.23, 261.63], [.42, 196], [.62, 155.56]]) {
        const elapsed = t - delay;
        if (elapsed > 0) defeat[i] += .12 * Math.min(1, elapsed / .02) * Math.exp(-elapsed * 2.5) * Math.min(1, (3 - t) / .3) * Math.sin(tau * frequency * elapsed);
    }
}
save('sfx/final-defeat.wav', defeat);
