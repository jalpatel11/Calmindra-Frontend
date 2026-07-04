export const runtime = "edge";
export const maxDuration = 30;

import {
  MAX_MESSAGE_LENGTH,
  type ProxySession,
  backendHeaders,
  getBackendUrl,
  getAuthenticatedProxySession,
  normalizeSafeId,
  sameOriginGuard,
  safeTextResponse,
  withApiHeaders,
} from "@/lib/server/proxy";

type IncomingMessagePart = {
  type?: string;
  text?: string;
};

type IncomingMessage = {
  role?: string;
  content?: string | IncomingMessagePart[] | { text?: string };
  parts?: IncomingMessagePart[];
};

type ChatRequestBody = {
  id?: string;
  messages?: IncomingMessage[];
};

type UIMessageChunk =
  | { type: "start"; messageId: string }
  | { type: "text-start"; id: string }
  | { type: "text-delta"; id: string; delta: string }
  | { type: "text-end"; id: string }
  | { type: "finish"; finishReason: "stop" | "error" };

const STREAM_HEADERS = {
  "Content-Type": "text/event-stream; charset=utf-8",
  "Cache-Control": "no-cache, no-transform",
  "X-Accel-Buffering": "no",
  "x-vercel-ai-ui-message-stream": "v1",
};

export async function POST(req: Request) {
  const originError = sameOriginGuard(req);
  if (originError) return originError;

  const session = await getAuthenticatedProxySession();
  if (!session) {
    return safeTextResponse("Unauthorized", { status: 401 });
  }

  try {
    const body = (await req.json()) as ChatRequestBody;
    const messageText = getLastUserMessageText(body.messages);

    if (!messageText) {
      return safeTextResponse("No user message found", { status: 400 }, session);
    }

    if (messageText.length > MAX_MESSAGE_LENGTH) {
      return streamAssistantText(
        "That message is a little too long for this chat. Try sending a shorter note.",
        session,
      );
    }

    const sessionId =
      normalizeSafeId(body.id) ||
      normalizeSafeId(req.headers.get("x-session-id")) ||
      crypto.randomUUID();

    const backendHeadersWithSession = {
      ...Object.fromEntries(backendHeaders(session, true)),
      "X-Session-ID": sessionId,
    };
    const backendPayload = JSON.stringify({
      user_message: messageText,
      session_id: sessionId,
    });

    const backendResponse = await fetch(getBackendUrl("/chat/stream"), {
      method: "POST",
      headers: backendHeadersWithSession,
      body: backendPayload,
      cache: "no-store",
    });

    if (backendResponse.ok && backendResponse.body) {
      return streamBackendText(backendResponse.body, session, {
        headers: { "X-Session-ID": sessionId },
      });
    }

    if (backendResponse.status === 404 || backendResponse.status === 405) {
      return proxyLegacyChatRequest(backendPayload, backendHeadersWithSession, session, sessionId);
    }

    if (!backendResponse.ok) {
      return streamBackendError(backendResponse.status, session);
    }

    return streamAssistantText(
      "I could not read Calmindra's response just now. Please try again in a moment.",
      session,
      { headers: { "X-Session-ID": sessionId } },
    );
  } catch (error) {
    console.error("POST /api/chat failed:", error);
    return streamAssistantText(
      "I could not reach Calmindra just now. Please try again in a moment.",
      session,
    );
  }
}

function getLastUserMessageText(messages: ChatRequestBody["messages"]) {
  const lastMessage = messages?.at(-1);
  if (!lastMessage || lastMessage.role !== "user") return "";

  const text = extractMessageText(lastMessage);
  return text.trim();
}

function extractMessageText(message: IncomingMessage) {
  if (typeof message.content === "string") return message.content;

  if (Array.isArray(message.content)) {
    return getTextFromParts(message.content);
  }

  if (typeof message.content?.text === "string") {
    return message.content.text;
  }

  if (Array.isArray(message.parts)) {
    return getTextFromParts(message.parts);
  }

  return "";
}

function getTextFromParts(parts: IncomingMessagePart[]) {
  return parts
    .filter((part) => part.type === "text" && typeof part.text === "string")
    .map((part) => part.text)
    .join("\n");
}

function streamBackendError(status: number, session: ProxySession) {
  if (status === 429) {
    return streamAssistantText(
      "I need a short pause before replying again. Please try once more in a minute.",
      session,
      { headers: { "X-Calmindra-Backend-Status": String(status) } },
    );
  }

  if (status === 413) {
    return streamAssistantText(
      "That message is a little too long for this chat. Try sending a shorter note.",
      session,
      { headers: { "X-Calmindra-Backend-Status": String(status) } },
    );
  }

  return streamAssistantText(
    "I could not complete that request just now. Please try again in a moment.",
    session,
    { headers: { "X-Calmindra-Backend-Status": String(status) } },
  );
}

async function proxyLegacyChatRequest(
  body: string,
  headers: HeadersInit,
  session: ProxySession,
  sessionId: string,
) {
  const backendResponse = await fetch(getBackendUrl("/chat/"), {
    method: "POST",
    headers,
    body,
    cache: "no-store",
  });

  if (!backendResponse.ok) {
    return streamBackendError(backendResponse.status, session);
  }

  const data = await backendResponse.json();
  const botMessage =
    typeof data?.bot_message === "string" && data.bot_message.trim()
      ? data.bot_message
      : "I am here with you. Could you tell me a little more?";

  return streamAssistantText(botMessage, session, {
    headers: { "X-Session-ID": sessionId },
  });
}

function streamBackendText(
  body: ReadableStream<Uint8Array>,
  session: ProxySession,
  init: ResponseInit = {},
) {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const textId = crypto.randomUUID();
  const messageId = crypto.randomUUID();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let hasText = false;
      const reader = body.getReader();

      enqueueEvent(controller, encoder, { type: "start", messageId });
      enqueueEvent(controller, encoder, { type: "text-start", id: textId });

      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          const delta = decoder.decode(value, { stream: true });
          if (delta) {
            hasText = true;
            enqueueEvent(controller, encoder, { type: "text-delta", id: textId, delta });
          }
        }

        const tail = decoder.decode();
        if (tail) {
          hasText = true;
          enqueueEvent(controller, encoder, { type: "text-delta", id: textId, delta: tail });
        }

        if (!hasText) {
          enqueueEvent(controller, encoder, {
            type: "text-delta",
            id: textId,
            delta: "I am here with you. Could you tell me a little more?",
          });
        }

        enqueueEvent(controller, encoder, { type: "text-end", id: textId });
        enqueueEvent(controller, encoder, { type: "finish", finishReason: "stop" });
      } catch (error) {
        console.error("Backend chat stream failed:", error);
        if (!hasText) {
          enqueueEvent(controller, encoder, {
            type: "text-delta",
            id: textId,
            delta: "I could not reach Calmindra just now. Please try again in a moment.",
          });
        }
        enqueueEvent(controller, encoder, { type: "text-end", id: textId });
        enqueueEvent(controller, encoder, { type: "finish", finishReason: "error" });
      } finally {
        reader.releaseLock();
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      }
    },
  });

  const headers = new Headers(init.headers);
  for (const [key, value] of Object.entries(STREAM_HEADERS)) {
    headers.set(key, value);
  }

  const response = new Response(stream, {
    ...init,
    headers,
  });

  return withApiHeaders(response, session);
}

function streamAssistantText(
  text: string,
  session: ProxySession,
  init: ResponseInit = {},
) {
  const encoder = new TextEncoder();
  const textId = crypto.randomUUID();
  const messageId = crypto.randomUUID();
  const chunks = splitForReadableStreaming(text);
  const delayMs = Math.max(4, Math.min(18, Math.floor(900 / Math.max(chunks.length, 1))));

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      enqueueEvent(controller, encoder, { type: "start", messageId });
      enqueueEvent(controller, encoder, { type: "text-start", id: textId });

      for (const delta of chunks) {
        enqueueEvent(controller, encoder, { type: "text-delta", id: textId, delta });
        await wait(delayMs);
      }

      enqueueEvent(controller, encoder, { type: "text-end", id: textId });
      enqueueEvent(controller, encoder, { type: "finish", finishReason: "stop" });
      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();
    },
  });

  const headers = new Headers(init.headers);
  for (const [key, value] of Object.entries(STREAM_HEADERS)) {
    headers.set(key, value);
  }

  const response = new Response(stream, {
    ...init,
    headers,
  });

  return withApiHeaders(response, session);
}

function enqueueEvent(
  controller: ReadableStreamDefaultController<Uint8Array>,
  encoder: TextEncoder,
  chunk: UIMessageChunk,
) {
  controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
}

function splitForReadableStreaming(text: string) {
  const pieces = text.match(/\S+\s*/g);
  if (!pieces) return [text];

  const chunks: string[] = [];
  for (let i = 0; i < pieces.length; i += 3) {
    chunks.push(pieces.slice(i, i + 3).join(""));
  }
  return chunks;
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
