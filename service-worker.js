const CACHE_NAME = "lettering-shell-v1";
const APP_SHELL = [
    "./", "./index.html", "./manifest.webmanifest",
    "./style/index.css", "./style/access.css", "./style/menu.css", "./style/modes.css",
    "./style/classic.css", "./style/flashcards.css", "./style/versus.css", "./style/tour-guide.css",
    "./script/main.js", "./assets/languages/pt-BR.json",
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
            if (response.ok) {
                const copy = response.clone();
                caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
            }
            return response;
        }).catch(() => cached);
        return cached || network;
    }));
});
