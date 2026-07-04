"use client";

import { 
  AssistantRuntimeProvider, 
  useRemoteThreadListRuntime,
  useThreadListItem,
} from "@assistant-ui/react";
import { useChatRuntime, AssistantChatTransport } from "@assistant-ui/react-ai-sdk";
import { Thread } from "@/components/assistant-ui/thread";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@/components/ui/separator";
import { Brain, Sparkles } from "lucide-react";
import { myThreadListAdapter, makeHistoryAdapter } from "@/hooks/use-thread-manager";
import { UserMenu } from "@/components/auth/user-menu";

export const Assistant = () => {
  const runtime = useRemoteThreadListRuntime({
    adapter: myThreadListAdapter,
    runtimeHook: () => {
      // Fetch the thread ID for the currently mounted thread from the assistant-ui context
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const { id: threadId } = useThreadListItem();
      
      // eslint-disable-next-line react-hooks/rules-of-hooks
      return useChatRuntime({
        transport: new AssistantChatTransport({
          api: "/api/chat",
          headers: {
            "x-session-id": threadId,
          },
        }),
        adapters: {
          history: makeHistoryAdapter(threadId),
        },
      });
    },
  });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-3 border-b border-emerald-950/10 bg-white/90 px-4 backdrop-blur">
            <SidebarTrigger className="text-slate-700" />
            <Separator orientation="vertical" className="mr-1 h-5 bg-emerald-950/10" />
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-700 text-white shadow-sm">
                <Brain className="size-5" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-950">Calmindra</p>
                <p className="truncate text-xs text-slate-500">AI wellbeing companion</p>
              </div>
            </div>
            <div className="ml-auto hidden items-center gap-2 rounded-full border border-emerald-900/10 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-800 sm:flex">
              <Sparkles className="size-3.5" />
              Ready
            </div>
            <UserMenu />
          </header>
          <Thread />
        </SidebarInset>
      </SidebarProvider>
    </AssistantRuntimeProvider>
  );
};
