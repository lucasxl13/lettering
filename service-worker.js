const CACHE_NAME = "lettering-shell-v9";
const APP_SHELL = [
    "./", "./index.html", "./manifest.webmanifest",
    "./style/index.css", "./style/access.css", "./style/menu.css", "./style/modes.css",
    "./style/classic.css", "./style/flashcards.css", "./style/versus.css", "./style/tour-guide.css",
    "./script/main.js", "./script/systems/loading.js", "./script/systems/tour-guide.js",
    "./assets/languages/pt-BR.json", "./assets/languages/en-US.json", "./assets/languages/es-ES.json",
    "./assets/icons/lettering-192.png", "./assets/icons/lettering-512.png"
];

self.addEventListener("install", event => {
    // cache: "reload" ignora o cache HTTP do navegador; sem isso a versão nova seria montada com arquivos velhos.
    event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(
        APP_SHELL.map(url => new Request(url, { cache: "reload" }))
    )));
    self.skipWaiting();
});

self.addEventListener("activate", event => {
    event.waitUntil(caches.keys().then(keys => Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
    )).then(() => self.clients.claim()));
});

// Em desenvolvimento (localhost) nada é interceptado: o cache serviria código
// antigo depois de cada edição. O app continua instalável, só não fica offline.
const IS_LOCAL_DEVELOPMENT = ["localhost", "127.0.0.1", "[::1]"].includes(self.location.hostname);

self.addEventListener("fetch", event => {
    if (IS_LOCAL_DEVELOPMENT) return;
    const request = event.request;
    const url = new URL(request.url);
    if (request.method !== "GET" || url.origin !== self.location.origin || url.pathname.includes("/api/")) return;
    // Audio is fetched in byte ranges (206 Partial Content), which the Cache API rejects.
    if (request.headers.has("range")) return;

    if (request.mode === "navigate") {
        event.respondWith(fetch(request, { cache: "no-cache" }).then(response => {
            const copy = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put("./index.html", copy));
            return response;
        }).catch(() => caches.match("./index.html")));
        return;
    }

    event.respondWith(caches.match(request).then(cached => {
        // "no-cache" revalida com o servidor; sem isso a atualização em segundo plano podia
        // receber do cache HTTP a mesma versão antiga e nunca trocar o arquivo.
        const network = fetch(request, { cache: "no-cache" }).then(response => {
            if (response.status === 200) {
                const copy = response.clone();
                caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
            }
            return response;
        }).catch(() => cached);
        return cached || network;
    }));
});
