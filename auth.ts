import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import { NextResponse } from "next/server";

export const enabledAuthProviders = [
  process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET
    ? { id: "google", name: "Google" }
    : null,
  process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET
    ? { id: "github", name: "GitHub" }
    : null,
  process.env.AUTH_DEV_PASSWORD && process.env.NODE_ENV !== "production"
    ? { id: "dev-login", name: "Development login" }
    : null,
].filter((provider): provider is { id: string; name: string } => Boolean(provider));

const authConfig: NextAuthConfig = {
  secret:
    process.env.AUTH_SECRET ||
    (process.env.NODE_ENV === "production"
      ? undefined
      : "calmindra-local-development-secret-change-before-production"),
  trustHost: true,
  pages: {
    signIn: "/sign-in",
  },
  session: {
    strategy: "jwt",
  },
  providers: [
    ...(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET ? [Google] : []),
    ...(process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET ? [GitHub] : []),
    ...(process.env.AUTH_DEV_PASSWORD && process.env.NODE_ENV !== "production"
      ? [
          Credentials({
            id: "dev-login",
            name: "Development login",
            credentials: {
              email: { label: "Email", type: "email" },
              password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
              const email =
                typeof credentials?.email === "string"
                  ? credentials.email.trim().toLowerCase()
                  : "";
              const password =
                typeof credentials?.password === "string" ? credentials.password : "";

              if (!email || password !== process.env.AUTH_DEV_PASSWORD) {
                return null;
              }

              return {
                id: `dev:${email}`,
                email,
                name: email.split("@")[0] || "Calmindra user",
              };
            },
          }),
        ]
      : []),
  ],
  callbacks: {
    authorized({ request, auth }) {
      const pathname = request.nextUrl.pathname;
      const isAuthenticated = Boolean(auth?.user);

      if (
        pathname === "/sign-in" ||
        pathname.startsWith("/api/auth") ||
        pathname.startsWith("/_next") ||
        pathname === "/favicon.ico"
      ) {
        return true;
      }

      if (pathname.startsWith("/api/")) {
        return isAuthenticated
          ? true
          : NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      return isAuthenticated;
    },
    jwt({ token, user, account }) {
      if (user?.id) {
        token.providerUserId = user.id;
      }

      if (account?.provider && account.providerAccountId) {
        token.providerUserId = `${account.provider}:${account.providerAccountId}`;
      }

      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id =
          typeof token.providerUserId === "string"
            ? token.providerUserId
            : token.sub || session.user.email || "";
      }

      return session;
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
