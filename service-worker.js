const CACHE_NAME = "lettering-shell-v7";
const APP_SHELL = [
    "./", "./index.html", "./manifest.webmanifest",
    "./style/index.css", "./style/access.css", "./style/menu.css", "./style/modes.css",
    "./style/classic.css", "./style/flashcards.css", "./style/versus.css", "./style/tour-guide.css",
    "./script/main.js", "./script/systems/loading.js", "./script/systems/tour-guide.js",
    "./assets/languages/pt-BR.json", "./assets/languages/en-US.json", "./assets/languages/es-ES.json",
    "./assets/icons/lettering-192.png", "./assets/icons/lettering-512.png"
];

self.addEventListener("install", event => {
    event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)));
    self.skipWaiting();
});

self.addEventListener("activate", event => {
    event.waitUntil(caches.keys().then(keys => Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
    )).then(() => self.clients.claim()));
});

self.addEventListener("fetch", event => {
    const request = event.request;
    const url = new URL(request.url);
    if (request.method !== "GET" || url.origin !== self.location.origin || url.pathname.includes("/api/")) return;
    // Audio is fetched in byte ranges (206 Partial Content), which the Cache API rejects.
    if (request.headers.has("range")) return;

    if (request.mode === "navigate") {
        event.respondWith(fetch(request).then(response => {
            const copy = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put("./index.html", copy));
            return response;
        }).catch(() => caches.match("./index.html")));
        return;
    }

    event.respondWith(caches.match(request).then(cached => {
        const network = fetch(request).then(response => {
            if (response.status === 200) {
                const copy = response.clone();
                caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
            }
            return response;
        }).catch(() => cached);
        return cached || network;
    }));
});
