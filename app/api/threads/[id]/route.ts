import {
  backendHeaders,
  getBackendUrl,
  getAuthenticatedProxySession,
  normalizeSafeId,
  safeJsonResponse,
  safeTextResponse,
  sameOriginGuard,
  verifyThreadOwnership,
} from "@/lib/server/proxy";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const originError = sameOriginGuard(req);
  if (originError) return originError;

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
      return safeTextResponse("Thread not found", { status: 404 }, session);
    }

    const res = await fetch(getBackendUrl(`/threads/${encodeURIComponent(threadId)}`), {
      method: "DELETE",
      headers: backendHeaders(session),
      cache: "no-store",
    });

    if (!res.ok) {
      return safeTextResponse("Unable to delete thread", { status: 502 }, session);
    }

    return safeJsonResponse({ success: true }, {}, session);
  } catch (error) {
    console.error("DELETE /api/threads/[id] failed:", error);
    return safeTextResponse("Unable to delete thread", { status: 502 }, session);
  }
}
