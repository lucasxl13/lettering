import { API_BASE_URL } from "../config.js";

const SESSION_KEY = "lettering-auth-session";

let activeSession = null;

export class AuthRequestError extends Error {
    constructor(code, message, status = 0) {
        super(message);
        this.name = "AuthRequestError";
        this.code = code;
        this.status = status;
    }
}

export function getSession() {
    return activeSession;
}

function getSavedSession() {
    const savedSession = localStorage.getItem(SESSION_KEY);

    if (!savedSession) return null;

    try {
        return JSON.parse(savedSession);
    } catch {
        localStorage.removeItem(SESSION_KEY);
        return null;
    }
}

export async function checkSession() {
    const session = getSavedSession();

    if (!session?.token) return null;

    try {
        const data = await requestAuth("/auth/me", {
            method: "GET",
            headers: {
                Authorization: `Bearer ${session.token}`
            }
        });
        const validatedSession = {
            token: session.token,
            user: data.user
        };

        saveSession(validatedSession);
        return validatedSession;
    } catch (error) {
        if (error instanceof AuthRequestError && error.status === 401) {
            clearSession();
        }
        return null;
    }
}

export async function login(email, password) {
    const session = await requestAuth("/auth/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
    });

    saveSession(session);
    return session;
}

export async function logout() {
    clearSession();
}

async function requestAuth(path, options) {
    let response;

    try {
        response = await fetch(`${API_BASE_URL}${path}`, options);
    } catch {
        throw new AuthRequestError("NETWORK_ERROR", "Could not connect to the server");
    }

    const data = await response.json().catch(() => null);

    if (!response.ok) {
        throw new AuthRequestError(
            data?.error?.code || "AUTH_REQUEST_FAILED",
            data?.error?.message || "Authentication request failed",
            response.status
        );
    }

    return data;
}

function saveSession(session) {
    activeSession = session;
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

function clearSession() {
    activeSession = null;
    localStorage.removeItem(SESSION_KEY);
}
