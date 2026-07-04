import * as React from "react"
import { Github, Brain, HeartPulse, ShieldAlert } from "lucide-react"
import Link from "next/link"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { ThreadList } from "./assistant-ui/thread-list"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar {...props} className="border-emerald-950/10">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
                <Link href="#" className="cursor-default">
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-emerald-700 text-white">
                    <Brain className="size-4" />
                  </div>
                  <div className="flex flex-col gap-0.5 leading-none">
                    <span className="text-lg font-bold text-slate-950">
                      Calmindra
                    </span>
                    <span className="text-xs text-slate-500">Mental health companion</span>
                  </div>
                </Link>
              </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <div className="px-3 py-2">
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
            <div className="flex items-center gap-2 mb-2">
              <ShieldAlert className="h-4 w-4 text-amber-700" />
              <span className="text-sm font-medium text-amber-950">Urgent support</span>
            </div>
            <p className="text-xs leading-5 text-amber-900">
              If you may hurt yourself or someone else, call emergency services or a local crisis line now.
            </p>
          </div>
          
          <div className="mb-3 flex items-center gap-2 px-1 text-xs font-semibold uppercase text-slate-500">
            <HeartPulse className="h-3.5 w-3.5" />
            Conversations
          </div>
        </div>
        
        <ThreadList />
      </SidebarContent>
      
      <SidebarRail />
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="https://github.com/jalpatel11/calmindra" target="_blank">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-slate-900 text-white">
                  <Github className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold text-slate-900">Calmindra</span>
                  <span className="text-xs text-slate-500">Open source</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
