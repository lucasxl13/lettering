import assert from "node:assert/strict";
import test from "node:test";
import { existsSync, readFileSync } from "node:fs";

const root = new URL("../", import.meta.url);

test("PWA manifest exposes installable icons and standalone display", () => {
    const manifest = JSON.parse(readFileSync(new URL("manifest.webmanifest", root), "utf8"));
    assert.equal(manifest.display, "standalone");
    assert.equal(manifest.start_url, "./");
    assert.ok(manifest.icons.some(icon => icon.sizes === "192x192"));
    assert.ok(manifest.icons.some(icon => icon.sizes === "512x512"));
    manifest.icons.forEach(icon => assert.ok(existsSync(new URL(icon.src, root))));
    assert.ok(existsSync(new URL("assets/icons/lettering-180.png", root)));
});

test("page links the manifest, Apple icon and service worker registration", () => {
    const html = readFileSync(new URL("index.html", root), "utf8");
    const main = readFileSync(new URL("script/main.js", root), "utf8");
    assert.match(html, /rel="manifest" href="manifest\.webmanifest"/);
    assert.match(html, /rel="apple-touch-icon"/);
    assert.match(main, /navigator\.serviceWorker\.register/);
});

test("home-screen installation copy exists in every interface language", () => {
    for (const language of ["pt-BR", "en-US", "es-ES"]) {
        const messages = JSON.parse(readFileSync(new URL(`assets/languages/${language}.json`, root), "utf8"));
        assert.ok(messages.add_to_home_screen);
        assert.ok(messages.pwa_install_hint);
        assert.ok(messages.pwa_ios_instructions);
    }
});
