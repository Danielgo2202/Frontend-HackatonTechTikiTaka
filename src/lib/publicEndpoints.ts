/**
 * Centralized public (browser) API + WebSocket URLs.
 * Never resolve backend hosts against window.location — always absolute URLs with scheme.
 */

const DEV = process.env.NODE_ENV === "development";

const LOCAL_API = "http://localhost:8000";
const LOCAL_WS = "ws://localhost:8000/ws";

function trim(s: string | undefined): string | undefined {
  const t = s?.trim();
  return t || undefined;
}

/** True if host looks like local dev (no TLS on WS). */
function isLocalHostish(host: string): boolean {
  return /^localhost$/i.test(host) || /^127\.0\.0\.1$/i.test(host) || /^\[::1\]$/i.test(host);
}

/**
 * Ensures an absolute http(s) origin suitable as fetch base (no trailing slash).
 */
export function normalizeHttpApiUrl(input: string): string {
  let s = input.trim();
  if (!s) {
    throw new Error("[env] NEXT_PUBLIC_API_URL is empty after trim");
  }
  if (/^https?:\/\//i.test(s)) {
    return s.replace(/\/+$/, "");
  }
  if (s.startsWith("//")) {
    s = `https:${s}`;
    return s.replace(/\/+$/, "");
  }
  const withScheme = `https://${s.replace(/^\/+/, "")}`;
  return withScheme.replace(/\/+$/, "");
}

/**
 * Ensures an absolute ws(s) URL. Bare host gets wss:// in prod-like hosts, ws:// for localhost.
 */
export function normalizeWebSocketUrl(input: string): string {
  let s = input.trim();
  if (!s) {
    throw new Error("[env] NEXT_PUBLIC_WS_URL is empty after trim");
  }
  if (/^wss?:\/\//i.test(s)) {
    return s;
  }
  if (/^https:\/\//i.test(s)) {
    return `wss://${s.slice("https://".length)}`;
  }
  if (/^http:\/\//i.test(s)) {
    return `ws://${s.slice("http://".length)}`;
  }
  if (s.startsWith("//")) {
    return `wss:${s}`;
  }
  const rest = s.replace(/^\/+/, "");
  const hostPort = rest.split("/")[0] ?? "";
  const host = hostPort.includes(":")
    ? (hostPort.split(":")[0] ?? hostPort)
    : hostPort;
  const scheme = isLocalHostish(host) ? "ws://" : "wss://";
  return `${scheme}${rest}`;
}

/** Default FastAPI WS path when only origin or bare host is provided. */
const DEFAULT_WS_PATH = "/ws";

export function ensureWebSocketPath(wsUrl: string, path = DEFAULT_WS_PATH): string {
  let u: URL;
  try {
    u = new URL(wsUrl);
  } catch {
    return wsUrl;
  }
  if (u.pathname === "/" || u.pathname === "") {
    u.pathname = path.startsWith("/") ? path : `/${path}`;
  }
  return u.href;
}

function deriveWsFromApi(apiBaseNoSlash: string): string {
  const u = new URL(apiBaseNoSlash.endsWith("/") ? apiBaseNoSlash : `${apiBaseNoSlash}/`);
  const scheme = u.protocol === "https:" ? "wss:" : "ws:";
  return `${scheme}//${u.host}${DEFAULT_WS_PATH}`;
}

/** Build an absolute URL for a path under the API origin (never relative to the Vercel page). */
export function joinApiPath(apiBaseUrl: string, path: string): URL {
  const base = `${normalizeHttpApiUrl(apiBaseUrl).replace(/\/+$/, "")}/`;
  const rel = path.replace(/^\/+/, "");
  return new URL(rel, base);
}

export type PublicEndpoints = {
  apiBaseUrl: string | undefined;
  wsUrl: string | undefined;
};

let loggedOnce = false;

/**
 * Reads NEXT_PUBLIC_* with safe normalization.
 * Local defaults only when NODE_ENV === "development" and vars are unset.
 */
export function getPublicEndpoints(): PublicEndpoints {
  const rawApi = trim(process.env.NEXT_PUBLIC_API_URL);
  const rawWs = trim(process.env.NEXT_PUBLIC_WS_URL);

  let apiBaseUrl: string | undefined;
  let wsUrl: string | undefined;

  try {
    if (rawApi) {
      apiBaseUrl = normalizeHttpApiUrl(rawApi);
    } else if (DEV) {
      apiBaseUrl = LOCAL_API;
    }

    if (rawWs) {
      wsUrl = ensureWebSocketPath(normalizeWebSocketUrl(rawWs));
    } else if (apiBaseUrl) {
      wsUrl = ensureWebSocketPath(deriveWsFromApi(apiBaseUrl));
    } else if (DEV) {
      wsUrl = LOCAL_WS;
    }
  } catch (e) {
    console.error("[env] Invalid NEXT_PUBLIC_API_URL / NEXT_PUBLIC_WS_URL:", e);
  }

  if (!loggedOnce && typeof window !== "undefined") {
    loggedOnce = true;
    console.info("[env] Public endpoints resolved:", {
      NODE_ENV: process.env.NODE_ENV,
      apiBaseUrl: apiBaseUrl ?? "(none)",
      wsUrl: wsUrl ?? "(none)",
      hadRawApi: Boolean(rawApi),
      hadRawWs: Boolean(rawWs),
    });
  }

  return { apiBaseUrl, wsUrl };
}
