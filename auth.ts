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
  { id: "credentials", name: "Email and Password" },
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
    Credentials({
      id: "credentials",
      name: "Email and Password",
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

        if (!email || !password) {
          return null;
        }

        try {
          const backendUrl = process.env.BACKEND_URL || "http://localhost:8000";
          const res = await fetch(`${backendUrl}/auth/login`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Backend-Secret":
                process.env.BACKEND_API_SECRET ||
                "calmindra-local-development-secret-change-before-production",
            },
            body: JSON.stringify({ email, password }),
            cache: "no-store",
          });

          if (!res.ok) {
            return null;
          }

          const data = await res.json();
          return {
            id: data.id,
            email,
            name: email.split("@")[0] || "Calmindra user",
          };
        } catch (error) {
          console.error("Credentials authorize failed:", error);
          return null;
        }
      },
    }),
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
