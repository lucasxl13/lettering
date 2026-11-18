// Fogo em pixels (algoritmo clássico de propagação para cima) pintado com as cores
// do tema atual. Usado atrás da linha do 1º lugar no ranking.
const PIXEL_SIZE = 5;
const MAX_HEAT = 16;
const FRAME_MS = 55;

export function startPixelFire(canvas) {
    const context = canvas.getContext("2d");
    if (!context) return () => {};

    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const palette = createPalette(getComputedStyle(canvas));
    let width = 0;
    let height = 0;
    let heat = new Uint8Array(0);
    let image = null;
    let timer = null;

    const resize = () => {
        const nextWidth = Math.max(1, Math.ceil(canvas.clientWidth / PIXEL_SIZE));
        const nextHeight = Math.max(1, Math.ceil(canvas.clientHeight / PIXEL_SIZE));
        if (nextWidth === width && nextHeight === height) return;
        width = nextWidth;
        height = nextHeight;
        canvas.width = width;
        canvas.height = height;
        heat = new Uint8Array(width * height);
        heat.fill(MAX_HEAT, (height - 1) * width);
        image = context.createImageData(width, height);
    };

    const step = () => {
        // Decaimento baixo e pouca variação: forma línguas de fogo em vez de ruído.
        for (let x = 0; x < width; x++) {
            for (let y = 1; y < height; y++) {
                const source = y * width + x;
                const roll = Math.random();
                const decay = roll < .22 ? 0 : roll < .6 ? 1 : 2;
                const drift = decay === 0 ? 0 : Math.floor(Math.random() * 3) - 1;
                const target = source - width + drift;
                if (target < 0) continue;
                heat[target] = Math.max(0, heat[source] - decay);
            }
        }
        // A base também tremula um pouco, para não virar uma faixa sólida.
        for (let x = 0; x < width; x++) {
            heat[(height - 1) * width + x] = MAX_HEAT - Math.floor(Math.random() * 3);
        }
    };

    const draw = () => {
        const data = image.data;
        for (let i = 0; i < heat.length; i++) {
            const [r, g, b, a] = palette[heat[i]];
            const offset = i * 4;
            data[offset] = r;
            data[offset + 1] = g;
            data[offset + 2] = b;
            data[offset + 3] = a;
        }
        context.putImageData(image, 0, 0);
    };

    const tick = () => {
        if (!canvas.isConnected) {
            stop();
            return;
        }
        resize();
        step();
        draw();
    };

    const stop = () => clearInterval(timer);

    resize();
    // Aquece antes de mostrar, para não começar com o canvas vazio.
    for (let i = 0; i < height * 2; i++) step();
    draw();
    if (!reducedMotion) timer = setInterval(tick, FRAME_MS);
    return stop;
}

// Transparente → cor secundária → cor primária → primária clara → quase branco.
function createPalette(style) {
    const primary = parseColor(style.getPropertyValue("--primary-color")) ?? [255, 32, 32];
    const secondary = parseColor(style.getPropertyValue("--secondary-color")) ?? [160, 0, 0];
    const light = mix(primary, [255, 255, 255], .55);
    const white = [255, 250, 235];
    const stops = [
        [0, [...secondary, 0]],
        [.2, [...secondary, 0]],
        [.35, [...secondary, 170]],
        [.6, [...primary, 230]],
        [.8, [...light, 240]],
        [1, [...white, 255]]
    ];
    return Array.from({ length: MAX_HEAT + 1 }, (_, index) => {
        const position = index / MAX_HEAT;
        const upper = stops.findIndex(([stop]) => stop >= position);
        if (upper <= 0) return stops[0][1];
        const [start, from] = stops[upper - 1];
        const [end, to] = stops[upper];
        const amount = (position - start) / (end - start || 1);
        return from.map((value, channel) => Math.round(value + (to[channel] - value) * amount));
    });
}

function mix(from, to, amount) {
    return from.map((value, channel) => Math.round(value + (to[channel] - value) * amount));
}

function parseColor(value) {
    const hex = value.trim().match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i)?.[1];
    if (!hex) return null;
    const full = hex.length === 3 ? [...hex].map(char => char + char).join("") : hex;
    return [0, 2, 4].map(index => parseInt(full.slice(index, index + 2), 16));
}
