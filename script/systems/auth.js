const SESSION_KEY = "lettering-auth-session";

// TODO(SERVER-INTEGRATION): troque para false quando o servidor de autenticação existir.
const USE_MOCK_AUTH = true;

// TODO(SERVER-INTEGRATION): coloque aqui a URL real da API.
const AUTH_API_URL = "https://api.example.com";

let activeSession = null;

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

    if (USE_MOCK_AUTH) {
        activeSession = session;
        return session;
    }

    try {
        // TODO(SERVER-INTEGRATION): ajuste a rota e o formato da resposta da API.
        const response = await fetch(`${AUTH_API_URL}/auth/session`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${session.token}`
            }
        });

        if (!response.ok) {
            clearSession();
            return null;
        }

        const data = await response.json();
        const validatedSession = {
            token: session.token,
            user: data.user
        };

        saveSession(validatedSession);
        return validatedSession;
    } catch {
        // Sem resposta do servidor, a sessão não é iniciada.
        return null;
    }
}

export async function login(email, password) {
    if (USE_MOCK_AUTH) {
        const mockSession = {
            token: "mock-token-front-end",
            user: {
                name: email.split("@")[0] || "Player",
                email
            }
        };

        saveSession(mockSession);
        return mockSession;
    }

    // TODO(SERVER-INTEGRATION): ajuste a rota e os campos conforme o backend.
    const response = await fetch(`${AUTH_API_URL}/auth/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
        throw new Error("LOGIN_FAILED");
    }

    const session = await response.json();
    saveSession(session);
    return session;
}

export async function logout() {
    const session = getSavedSession();

    if (!USE_MOCK_AUTH && session?.token) {
        try {
            // TODO(SERVER-INTEGRATION): ajuste a rota de encerramento da sessão.
            await fetch(`${AUTH_API_URL}/auth/logout`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${session.token}`
                }
            });
        } catch {
            // A sessão local é removida mesmo se o servidor estiver indisponível.
        }
    }

    clearSession();
}

function saveSession(session) {
    activeSession = session;
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

function clearSession() {
    activeSession = null;
    localStorage.removeItem(SESSION_KEY);
}
