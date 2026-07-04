export const runtime = "edge";
export const maxDuration = 30;

import { createTextStreamResponse } from "ai";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("POST /api/chat request body:", JSON.stringify(body, null, 2));
    const { messages } = body;
    
    const lastMessage = messages?.[messages.length - 1];
    if (!lastMessage || lastMessage.role !== "user") {
      return new Response("No user message found", { status: 400 });
    }

    // Handle different message content formats
    let messageText = "";
    if (typeof lastMessage.content === "string") {
      messageText = lastMessage.content;
    } else if (Array.isArray(lastMessage.content)) {
      const textContent = lastMessage.content.find((item: { type: string; text?: string }) => item.type === "text");
      messageText = textContent?.text || "";
    } else if (lastMessage.content?.text) {
      messageText = lastMessage.content.text;
    } else if (Array.isArray(lastMessage.parts)) {
      const textContent = lastMessage.parts.find((item: { type: string; text?: string }) => item.type === "text");
      messageText = textContent?.text || "";
    }

    if (!messageText.trim()) {
      return new Response("Empty message", { status: 400 });
    }

    const sessionId = req.headers.get("x-session-id") || 
                     `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      const backendResponse = await fetch(`${BACKEND_URL}/chat/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Session-ID": sessionId,
        },
        body: JSON.stringify({
          user_message: messageText,
          session_id: sessionId,
        }),
      });

      if (!backendResponse.ok) {
        throw new Error(`Backend error: ${backendResponse.status}`);
      }

      const data = await backendResponse.json();
      const botMessage = data.bot_message || "";

      // Stream response word by word using Vercel AI SDK's official createTextStreamResponse
      const stream = new ReadableStream({
        async start(controller) {
          try {
            const words = botMessage.split(' ');
            for (let i = 0; i < words.length; i++) {
              const word = i === 0 ? words[i] : ' ' + words[i];
              controller.enqueue(`0:${JSON.stringify(word)}\n`);
              // Small delay to simulate typing/streaming effect
              await new Promise((resolve) => setTimeout(resolve, 30));
            }
            
            controller.enqueue(`e:${JSON.stringify({
              finishReason: "stop",
              usage: {
                promptTokens: messageText.split(' ').length,
                completionTokens: words.length
              }
            })}\n`);
            controller.close();
          } catch (error) {
            console.error("Streaming error:", error);
            controller.error(error);
          }
        }
      });

      return createTextStreamResponse({
        stream,
        headers: {
          "X-Session-ID": sessionId,
        }
      });

    } catch (error) {
      console.error("Backend error:", error);
      
      const fallbackText = "I apologize, but I'm having trouble connecting right now. Please try again.";
      
      // Stream fallback response word by word using Vercel AI SDK's official createTextStreamResponse
      const stream = new ReadableStream({
        async start(controller) {
          try {
            const words = fallbackText.split(' ');
            for (let i = 0; i < words.length; i++) {
              const word = i === 0 ? words[i] : ' ' + words[i];
              controller.enqueue(`0:${JSON.stringify(word)}\n`);
              // Small delay to simulate typing/streaming effect
              await new Promise((resolve) => setTimeout(resolve, 30));
            }
            
            controller.enqueue(`e:${JSON.stringify({
              finishReason: "stop",
              usage: {
                promptTokens: messageText.split(' ').length,
                completionTokens: words.length
              }
            })}\n`);
            controller.close();
          } catch (error) {
            console.error("Fallback streaming error:", error);
            controller.error(error);
          }
        }
      });

      return createTextStreamResponse({ stream });
    }

  } catch (error) {
    console.error("Chat API error:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
