import {
  backendHeaders,
  getBackendUrl,
  getAuthenticatedProxySession,
  normalizeSafeId,
  safeJsonResponse,
  safeTextResponse,
  verifyThreadOwnership,
} from "@/lib/server/proxy";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getAuthenticatedProxySession();
  if (!session) {
    return safeTextResponse("Unauthorized", { status: 401 });
  }

  try {
    const { id: rawId } = await params;
    const threadId = normalizeSafeId(rawId);

    if (!threadId) {
      return safeTextResponse("Invalid thread id", { status: 400 }, session);
    }

    const isOwned = await verifyThreadOwnership(threadId, session);
    if (!isOwned) {
      return safeJsonResponse([], { status: 404 }, session);
    }

    const res = await fetch(
      getBackendUrl(`/threads/${encodeURIComponent(threadId)}/messages`),
      {
        headers: backendHeaders(session),
        cache: "no-store",
      },
    );

    if (!res.ok) {
      return safeTextResponse("Unable to load messages", { status: 502 }, session);
    }

    const data = await res.json();
    return safeJsonResponse(Array.isArray(data) ? data : [], {}, session);
  } catch (error) {
    console.error("GET /api/threads/[id]/messages failed:", error);
    return safeTextResponse("Unable to load messages", { status: 502 }, session);
  }
}
