export const THEMES = [
    { id: "cyan-blue", labelKey: "cyan_blue" },
    { id: "dark-blue", labelKey: "dark_blue" },
    { id: "light-green", labelKey: "light_green" },
    { id: "dark-green", labelKey: "dark_green" },
    { id: "light-red", labelKey: "light_red" },
    { id: "dark-red", labelKey: "dark_red" },
    { id: "light-pink", labelKey: "light_pink" },
    { id: "magenta-pink", labelKey: "magenta_pink" },
    { id: "purple", labelKey: "purple" },
    { id: "yellow", labelKey: "yellow" },
    { id: "orange", labelKey: "orange" },
    { id: "silver-gray", labelKey: "silver_gray" }
];
const DEFAULT_THEME = "light-red";
const THEME_IDS = THEMES.map(theme => theme.id);

export function getTheme() {
    const savedTheme = localStorage.getItem("lettering-theme");
    return THEME_IDS.includes(savedTheme) ? savedTheme : DEFAULT_THEME;
}

export function setTheme(theme) {
    const selectedTheme = THEME_IDS.includes(theme) ? theme : DEFAULT_THEME;
    document.documentElement.dataset.theme = selectedTheme;
    localStorage.setItem("lettering-theme", selectedTheme);
    return selectedTheme;
}

export function loadTheme() {
    return setTheme(getTheme());
}
