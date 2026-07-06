import { auth } from "@/auth";

const USER_ID_PATTERN = /^usr_[a-f0-9]{32,64}$/i;
const SAFE_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;

export const MAX_MESSAGE_LENGTH = 500;

export type ProxySession = {
  userId: string;
};

export function getBackendUrl(pathname: string) {
  const rawUrl = process.env.BACKEND_URL || "http://localhost:8000";
  const base = new URL(rawUrl);

  if (base.protocol !== "http:" && base.protocol !== "https:") {
    throw new Error("BACKEND_URL must use http or https.");
  }

  const basePath = base.pathname.replace(/\/$/, "");
  return new URL(`${basePath}${pathname}`, base.origin).toString();
}

export async function getAuthenticatedProxySession(): Promise<ProxySession | null> {
  const session = await auth();
  const userKey = session?.user?.id || session?.user?.email;

  if (!userKey) {
    return null;
  }

  const userId = USER_ID_PATTERN.test(userKey)
    ? userKey
    : await createBackendUserId(userKey);

  return {
    userId,
  };
}

export function sameOriginGuard(req: Request) {
  const origin = req.headers.get("origin");
  if (!origin) return null;

  const forwardedHost = req.headers.get("x-forwarded-host");
  const forwardedProto = req.headers.get("x-forwarded-proto") || "https";
  
  let expectedOrigin = new URL(req.url).origin;
  if (forwardedHost) {
    expectedOrigin = `${forwardedProto}://${forwardedHost}`;
  }

  if (origin === expectedOrigin) return null;

  return safeTextResponse("Forbidden", { status: 403 });
}

export function normalizeSafeId(value: unknown) {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return SAFE_ID_PATTERN.test(trimmed) ? trimmed : undefined;
}

export function safeTitle(value: unknown, fallback = "New Chat Session") {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim().replace(/\s+/g, " ");
  if (!trimmed) return fallback;
  return trimmed.slice(0, 80);
}

export function backendHeaders(session: ProxySession, json = false) {
  const headers = new Headers();
  const backendSecret = process.env.BACKEND_API_SECRET;

  if (!backendSecret && process.env.NODE_ENV === "production") {
    throw new Error("BACKEND_API_SECRET must be configured in production.");
  }

  headers.set("X-User-ID", session.userId);
  if (backendSecret) headers.set("X-Backend-Secret", backendSecret);
  if (json) headers.set("Content-Type", "application/json");
  return headers;
}

export async function ensureBackendUser(session: ProxySession) {
  const headers = backendHeaders(session);

  try {
    const res = await fetch(getBackendUrl("/auth/me"), {
      method: "POST",
      headers,
      cache: "no-store",
    });

    return res.ok;
  } catch (error) {
    console.error("Unable to ensure backend user:", error);
    return false;
  }
}

export function safeJsonResponse(
  data: unknown,
  init: ResponseInit = {},
  session?: ProxySession,
) {
  const response = Response.json(data, init);
  return withApiHeaders(response, session);
}

export function safeTextResponse(
  body: string,
  init: ResponseInit = {},
  session?: ProxySession,
) {
  const response = new Response(body, init);
  return withApiHeaders(response, session);
}

export function withApiHeaders(response: Response, session?: ProxySession) {
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  if (session?.userId) {
    const vary = response.headers.get("Vary");
    response.headers.set("Vary", vary ? `${vary}, Cookie` : "Cookie");
  }
  return response;
}

export async function verifyThreadOwnership(threadId: string, session: ProxySession) {
  const res = await fetch(getBackendUrl("/threads/"), {
    headers: backendHeaders(session),
    cache: "no-store",
  });

  if (!res.ok) return false;

  const threads = await res.json();
  return Array.isArray(threads) && threads.some((thread) => thread?.id === threadId);
}

async function createBackendUserId(userKey: string) {
  const secret =
    process.env.AUTH_BACKEND_ID_SECRET ||
    process.env.AUTH_SECRET ||
    "calmindra-development-auth-id";
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(userKey));
  const hex = Array.from(new Uint8Array(signature), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
  const userId = `usr_${hex.slice(0, 32)}`;

  if (!USER_ID_PATTERN.test(userId)) {
    throw new Error("Generated invalid backend user id.");
  }

  return userId;
}
