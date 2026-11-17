export const SUPPORTED_LANGUAGES = ["pt-BR", "en-US", "es-ES"];
const DEFAULT_LANGUAGE = "pt-BR";
const STORAGE_KEY = "lettering-language";

let translations = {};
let currentLanguage = DEFAULT_LANGUAGE;

export function getSavedLanguage() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (SUPPORTED_LANGUAGES.includes(saved)) return saved;
    } catch {
        // Sem armazenamento: usa o idioma padrão.
    }
    return DEFAULT_LANGUAGE;
}

// Carrega o idioma pedido; se o arquivo falhar, tenta o padrão. Nunca lança erro,
// para que uma falha de rede não deixe a tela em branco (t() devolve a chave).
export async function loadLanguage(language) {
    const requested = SUPPORTED_LANGUAGES.includes(language) ? language : DEFAULT_LANGUAGE;
    const candidates = requested === DEFAULT_LANGUAGE ? [requested] : [requested, DEFAULT_LANGUAGE];

    for (const candidate of candidates) {
        try {
            const response = await fetch(`assets/languages/${candidate}.json`);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            translations = await response.json();
            currentLanguage = candidate;
            document.documentElement.lang = candidate;
            // Só grava a escolha do jogador; um fallback temporário não deve sobrescrevê-la.
            if (candidate === requested) {
                try {
                    localStorage.setItem(STORAGE_KEY, candidate);
                } catch {
                    // A escolha só não persiste.
                }
            }
            return true;
        } catch (error) {
            console.error(`Could not load language ${candidate}`, error);
        }
    }
    return false;
}

export function t(key) {
    return translations[key] ?? key;
}

export function getLanguage() {
    return currentLanguage;
}
