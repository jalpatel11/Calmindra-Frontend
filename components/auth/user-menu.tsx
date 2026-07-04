"use client";

import { Button } from "@/components/ui/button";
import { LogOut, UserRound } from "lucide-react";
import { signOut, useSession } from "next-auth/react";

export function UserMenu() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="h-9 w-9 animate-pulse rounded-full bg-slate-100 sm:w-32" />
    );
  }

  const label = session?.user?.name || session?.user?.email || "Signed in";

  return (
    <div className="flex items-center gap-2">
      <div className="hidden max-w-52 items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 shadow-sm sm:flex">
        <UserRound className="size-3.5 text-emerald-700" />
        <span className="truncate">{label}</span>
      </div>
      <Button
        type="button"
        variant="ghost"
        className="size-9 rounded-full p-0 text-slate-500 hover:bg-rose-50 hover:text-rose-700"
        onClick={() => signOut({ callbackUrl: "/sign-in" })}
      >
        <LogOut className="size-4" />
        <span className="sr-only">Sign out</span>
      </Button>
    </div>
  );
}
