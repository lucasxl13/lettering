const apiHost = window.location.hostname || "localhost";
const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";

export const API_BASE_URL = `http://${apiHost}:3000/api/v1`;
export const WS_BASE_URL = `${wsProtocol}//${apiHost}:3000/ws`;


