import { loadLanguage } from "./systems/language.js";
import { loadTheme } from "./systems/theme.js";
import { loadMenu } from "./screens/menu.js";
import { checkSession } from "./systems/auth.js";

loadTheme();
await loadLanguage("pt-BR");

await checkSession();
loadMenu();
