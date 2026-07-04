import {
  backendHeaders,
  getBackendUrl,
  getAuthenticatedProxySession,
  normalizeSafeId,
  safeJsonResponse,
  safeTextResponse,
  safeTitle,
  sameOriginGuard,
} from "@/lib/server/proxy";

export async function GET() {
  const session = await getAuthenticatedProxySession();
  if (!session) {
    return safeTextResponse("Unauthorized", { status: 401 });
  }

  try {
    const res = await fetch(getBackendUrl("/threads/"), {
      headers: backendHeaders(session),
      cache: "no-store",
    });

    if (!res.ok) {
      return safeTextResponse("Unable to load threads", { status: 502 }, session);
    }

    const data = await res.json();
    return safeJsonResponse(Array.isArray(data) ? data : [], {}, session);
  } catch (error) {
    console.error("GET /api/threads failed:", error);
    return safeTextResponse("Unable to load threads", { status: 502 }, session);
  }
}

export async function POST(req: Request) {
  const originError = sameOriginGuard(req);
  if (originError) return originError;

  const session = await getAuthenticatedProxySession();
  if (!session) {
    return safeTextResponse("Unauthorized", { status: 401 });
  }

  try {
    const body = await req.json();
    const id = normalizeSafeId(body?.id) || crypto.randomUUID();
    const title = safeTitle(body?.title);

    const res = await fetch(getBackendUrl("/threads/"), {
      method: "POST",
      headers: backendHeaders(session, true),
      body: JSON.stringify({ id, title }),
      cache: "no-store",
    });

    if (!res.ok) {
      return safeTextResponse("Unable to create thread", { status: 502 }, session);
    }

    const data = await res.json();
    return safeJsonResponse(data, {}, session);
  } catch (error) {
    console.error("POST /api/threads failed:", error);
    return safeTextResponse("Unable to create thread", { status: 502 }, session);
  }
}
