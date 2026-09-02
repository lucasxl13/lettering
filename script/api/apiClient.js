import { API_BASE_URL } from "../config.js";
import { getSession } from "../systems/auth.js";

export class ApiRequestError extends Error {
    constructor(code, message, status = 0, details = null) {
        super(message);
        this.name = "ApiRequestError";
        this.code = code;
        this.status = status;
        this.details = details;
    }
}

export async function requestApi(path, options = {}) {
    const session = getSession();
    const headers = new Headers(options.headers ?? {});

    if (session?.token) headers.set("Authorization", `Bearer ${session.token}`);
    if (options.body && !headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
    }

    let response;
    try {
        response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
    } catch {
        throw new ApiRequestError("NETWORK_ERROR", "Could not connect to the server");
    }

    const data = await response.json().catch(() => null);
    if (!response.ok) {
        throw new ApiRequestError(
            data?.error?.code ?? "API_REQUEST_FAILED",
            data?.error?.message ?? "API request failed",
            response.status,
            data?.error?.details ?? null
        );
    }

    return data;
}
