import { requestApi } from "./apiClient.js";

export function postMatch(options = {}) {
    const { mode = "classic", theme = null, language = "en-US" } = options;
    const payload = { mode, language };
    if (theme) payload.theme = theme;

    return requestApi("/matches", {
        method: "POST",
        body: JSON.stringify(payload)
    });
}

export function getMatches(limit = 20, offset = 0) {
    return requestApi(`/matches?limit=${limit}&offset=${offset}`);
}

export function getMatchState(matchId) {
    return requestApi(`/matches/${encodeURIComponent(matchId)}/state`);
}

export function postMatchPiece(matchId, input) {
    return requestApi(`/matches/${encodeURIComponent(matchId)}/pieces/place`, {
        method: "POST",
        body: JSON.stringify(input)
    });
}

export function postConfirmMatchWord(matchId, boardVersion) {
    return requestApi(`/matches/${encodeURIComponent(matchId)}/words/confirm`, {
        method: "POST",
        body: JSON.stringify({ boardVersion })
    });
}

export function postPauseMatch(matchId) {
    return requestApi(`/matches/${encodeURIComponent(matchId)}/pause`, {
        method: "POST",
        body: "{}"
    });
}

export function postResumeMatch(matchId) {
    return requestApi(`/matches/${encodeURIComponent(matchId)}/resume`, {
        method: "POST",
        body: "{}"
    });
}

export function postLeaveMatch(matchId) {
    return requestApi(`/matches/${encodeURIComponent(matchId)}/leave`, {
        method: "POST",
        body: "{}"
    });
}
