import { auth } from "@/auth";
import {
  ensureBackendUser,
  getAuthenticatedProxySession,
} from "@/lib/server/proxy";
import { redirect } from "next/navigation";
import { Assistant } from "./assistant";

export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await auth();

  if (!session?.user) {
    redirect("/sign-in");
  }

  const proxySession = await getAuthenticatedProxySession();
  if (!proxySession) {
    redirect("/sign-in");
  }

  await ensureBackendUser(proxySession);

  return <Assistant />;
}
