import {
  ExportedMessageRepository,
  type RemoteThreadListAdapter,
  type ThreadHistoryAdapter,
  type ThreadMessageLike,
} from "@assistant-ui/react";
import { createAssistantStream } from "assistant-stream";

type BackendThread = {
  id: string;
  title: string;
};

type BackendMessage = {
  id?: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
};

const generateUUID = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export const myThreadListAdapter: RemoteThreadListAdapter = {
  async list() {
    try {
      const res = await fetch("/api/threads", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to list threads");
      const threads = (await res.json()) as BackendThread[];
      return {
        threads: threads.map((t) => ({
          remoteId: t.id,
          title: t.title,
          status: "regular",
        })),
      };
    } catch (error) {
      console.error("Error listing remote threads:", error);
      return { threads: [] };
    }
  },
  
  async initialize() {
    try {
      const remoteUUID = generateUUID();
      const res = await fetch("/api/threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: remoteUUID,
          title: "New Chat Session",
        }),
      });
      if (!res.ok) throw new Error("Failed to initialize remote thread");
      const data = await res.json();
      return { remoteId: data.id, externalId: undefined };
    } catch (error) {
      console.error("Error initializing remote thread:", error);
      throw error;
    }
  },
  
  async delete(remoteId: string) {
    try {
      const res = await fetch(`/api/threads/${remoteId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete thread");
    } catch (error) {
      console.error("Error deleting remote thread:", error);
      throw error;
    }
  },
  
  async rename() {
    // The deployed backend does not expose persisted thread renaming yet.
  },
  
  async archive(remoteId: string) {
    try {
      const res = await fetch(`/api/threads/${remoteId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete thread during archive");
    } catch (error) {
      console.error(`Error archiving remote thread ${remoteId}:`, error);
      throw error;
    }
  },
  
  async unarchive() {
    // Archive maps to delete for this backend, so there is nothing to restore.
  },
  
  async generateTitle(_remoteId: string, unstable_messages: readonly any[]) {
    return createAssistantStream(async (controller) => {
      const firstUserMsg = unstable_messages.find((m: any) => m.role === "user");
      let title = "Chat Session";
      if (firstUserMsg && Array.isArray(firstUserMsg.content)) {
        const textContent = firstUserMsg.content.find((item: any) => item.type === "text")?.text;
        if (textContent) {
          title = textContent.substring(0, 30);
          if (textContent.length > 30) title += "...";
        }
      } else if (firstUserMsg && Array.isArray(firstUserMsg.parts)) {
        const textContent = firstUserMsg.parts.find((item: any) => item.type === "text")?.text;
        if (textContent) {
          title = textContent.substring(0, 30);
          if (textContent.length > 30) title += "...";
        }
      }
      controller.appendText(title);
    });
  },

  async fetch(threadId: string) {
    try {
      const res = await fetch("/api/threads", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch threads");
      const threads = (await res.json()) as BackendThread[];
      const thread = threads.find((t) => t.id === threadId);
      if (!thread) throw new Error(`Thread ${threadId} not found`);
      return {
        remoteId: thread.id,
        title: thread.title,
        status: "regular" as const,
      };
    } catch (error) {
      console.error(`Error fetching remote thread ${threadId}:`, error);
      throw error;
    }
  },
};

export const makeHistoryAdapter = (threadId: string): ThreadHistoryAdapter => ({
  async load() {
    if (!threadId) return { messages: [] };

    try {
      const res = await fetch(`/api/threads/${threadId}/messages`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Failed to load thread messages");
      const messages = (await res.json()) as BackendMessage[];
      
      return ExportedMessageRepository.fromArray(messages.map(toThreadMessageLike));
    } catch (error) {
      console.error(`Error loading messages for thread ${threadId}:`, error);
      return { messages: [] };
    }
  },
  
  async append() {
    // No-op: Saved on the backend during chat completions loop
  },

  withFormat(formatAdapter) {
    return {
      async load() {
        if (!threadId) return { messages: [] };

        try {
          const res = await fetch(`/api/threads/${threadId}/messages`, {
            cache: "no-store",
          });
          if (!res.ok) throw new Error("Failed to load thread messages");
          const messages = (await res.json()) as BackendMessage[];
          
          return {
            messages: messages.map((m) => {
              const uiMessage = {
                id: m.id || generateUUID(),
                role: m.role,
                parts: [
                  {
                    type: "text",
                    text: m.content
                  }
                ]
              };
              
              return formatAdapter.decode({
                id: uiMessage.id,
                parent_id: null,
                format: formatAdapter.format,
                content: uiMessage as any
              });
            })
          };
        } catch (error) {
          console.error(`Error loading formatted messages for thread ${threadId}:`, error);
          return { messages: [] };
        }
      },
      async append() {
        // No-op: Saved on the backend during chat completions loop
      }
    };
  }
});

function toThreadMessageLike(message: BackendMessage): ThreadMessageLike {
  return {
    id: message.id || generateUUID(),
    role: message.role,
    content: [{ type: "text", text: message.content }],
    createdAt: new Date(message.createdAt),
    ...(message.role === "assistant" && {
      status: { type: "complete", reason: "stop" } as const,
    }),
  };
}
