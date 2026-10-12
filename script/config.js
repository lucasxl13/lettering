const LOCAL_HOSTNAMES = ["127.0.0.1", "localhost"];
const REMOTE_SERVER_URL = "http://node226503-testandoaplicacao.sp1.br.saveincloud.net.br";

const serverUrl = LOCAL_HOSTNAMES.includes(window.location.hostname)
    ? `http://${window.location.hostname}:3000`
    : REMOTE_SERVER_URL;

export const API_BASE_URL = `${serverUrl}/api/v1`;
export const WS_BASE_URL = `${serverUrl.replace(/^http/, "ws")}/ws`;


