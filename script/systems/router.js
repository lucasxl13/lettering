// Guarda a tela atual no hash da URL (#/modes, #/classic?mode=learning...)
// para que um F5 reabra a mesma tela em vez de voltar ao menu.
// Usa replaceState: não cria entradas novas no histórico do navegador.

export function setRoute(name, params = {}) {
    const query = new URLSearchParams(
        Object.entries(params).filter(([, value]) => value !== null && value !== undefined && value !== "")
    ).toString();
    const hash = name ? `#/${name}${query ? `?${query}` : ""}` : "";
    if (hash === window.location.hash) return;
    const url = `${window.location.pathname}${window.location.search}${hash}`;
    window.history.replaceState(window.history.state, "", url);
}

export function getRoute() {
    const match = window.location.hash.match(/^#\/([a-z]+)(?:\?(.*))?$/);
    if (!match) return null;
    return { name: match[1], params: Object.fromEntries(new URLSearchParams(match[2] ?? "")) };
}
