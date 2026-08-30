let translations = {};
let currentLanguage = "pt-BR";

export async function loadLanguage(language) {
    const response = await fetch(`assets/languages/${language}.json`);

    translations = await response.json();
    currentLanguage = language;
}

export function t(key) {
    return translations[key] ?? key;
}

export function getLanguage() {
    return currentLanguage;
}
