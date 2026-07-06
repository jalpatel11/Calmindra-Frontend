import { auth } from "@/auth";
import {
  ensureBackendUser,
  getAuthenticatedProxySession,
} from "@/lib/server/proxy";
import { Assistant } from "./assistant";

export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await auth();
  const isLoggedIn = Boolean(session?.user);

  if (isLoggedIn) {
    const proxySession = await getAuthenticatedProxySession();
    if (proxySession) {
      await ensureBackendUser(proxySession);
    }
  }

  return <Assistant isLoggedIn={isLoggedIn} />;
}
