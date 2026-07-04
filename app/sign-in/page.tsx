import { auth, enabledAuthProviders, signIn } from "@/auth";
import { Button } from "@/components/ui/button";
import {
  Brain,
  Github,
  KeyRound,
  LogIn,
  ShieldCheck,
  UserPlus,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; mode?: string }>;
}) {
  const session = await auth();
  const params = await searchParams;
  const isSignup = params.mode === "signup";
  const oauthProviders = enabledAuthProviders.filter(
    (provider) => provider.id !== "credentials",
  );
  const hasCredentials = enabledAuthProviders.some((provider) => provider.id === "credentials");

  if (session?.user) {
    redirect("/");
  }

  let errorMessage = "";
  if (params.error) {
    if (params.error === "CredentialsSignin") {
      errorMessage = "Invalid email or password.";
    } else {
      errorMessage = params.error;
    }
  }

  return (
    <main className="min-h-screen bg-[#f6f8f7] text-slate-950">
      <section className="grid min-h-screen lg:grid-cols-[0.92fr_1.08fr]">
        <aside className="relative flex min-h-[360px] flex-col justify-between overflow-hidden bg-emerald-900 px-6 py-8 text-white sm:px-10 lg:min-h-screen lg:px-14 lg:py-12">
          <div className="relative z-10">
            <div className="flex items-center gap-3 text-sm font-medium text-emerald-50">
              <span className="flex size-11 items-center justify-center rounded-xl border border-white/15 bg-white/10">
                <Brain className="size-6" />
              </span>
              Calmindra
            </div>

            <div className="mt-16 max-w-xl lg:mt-28">
              <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-emerald-50">
                <ShieldCheck className="size-3.5" />
                Private by account
              </p>
              <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">
                A calmer place to continue the conversation.
              </h1>
              <p className="mt-5 max-w-md text-base leading-7 text-emerald-50/85">
                Sign in or create an account so your threads stay connected to you
                before anything reaches the Calmindra backend.
              </p>
            </div>
          </div>

          <div className="relative z-10 mt-10 grid gap-3 text-sm text-emerald-50/90 sm:grid-cols-3 lg:grid-cols-1">
            <div className="border-t border-white/15 pt-4">
              <div className="font-medium text-white">Protected identity</div>
              <p className="mt-1 leading-6">The browser never sends raw account details to Neo4j.</p>
            </div>
            <div className="border-t border-white/15 pt-4">
              <div className="font-medium text-white">Saved threads</div>
              <p className="mt-1 leading-6">Your history is scoped to your signed-in session.</p>
            </div>
            <div className="border-t border-white/15 pt-4">
              <div className="font-medium text-white">Secure proxy</div>
              <p className="mt-1 leading-6">Backend requests are made from the app server.</p>
            </div>
          </div>
        </aside>

        <div className="flex items-center justify-center px-4 py-10 sm:px-8">
          <section className="w-full max-w-md">
            <div className="mb-7 grid grid-cols-2 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
              <Link
                aria-current={!isSignup ? "page" : undefined}
                className={`flex h-10 items-center justify-center gap-2 rounded-lg text-sm font-medium transition ${
                  !isSignup
                    ? "bg-emerald-700 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                }`}
                href="/sign-in"
              >
                <LogIn className="size-4" />
                Sign in
              </Link>
              <Link
                aria-current={isSignup ? "page" : undefined}
                className={`flex h-10 items-center justify-center gap-2 rounded-lg text-sm font-medium transition ${
                  isSignup
                    ? "bg-emerald-700 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                }`}
                href="/sign-in?mode=signup"
              >
                <UserPlus className="size-4" />
                Create account
              </Link>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] sm:p-8">
              <div className="mb-7">
                <p className="text-sm font-medium text-emerald-700">
                  {isSignup ? "Start with Calmindra" : "Welcome back"}
                </p>
                <h2 className="mt-2 text-2xl font-semibold">
                  {isSignup ? "Create your account" : "Sign in to your account"}
                </h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {isSignup
                    ? "Use your email and password to create your private Calmindra space."
                    : "Enter your email and password to sign in."}
                </p>
              </div>

              {errorMessage ? (
                <div className="mb-5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                  {errorMessage}
                </div>
              ) : null}

              <div className="space-y-3">
                {oauthProviders.map((provider) => (
                  <form action={signInWithProvider} key={provider.id}>
                    <input type="hidden" name="provider" value={provider.id} />
                    <Button
                      type="submit"
                      variant="outline"
                      className="h-12 w-full justify-start gap-3 rounded-lg border-slate-200 bg-white px-4 text-slate-900 hover:bg-slate-50"
                    >
                      {provider.id === "github" ? (
                        <Github className="size-4" />
                      ) : (
                        <KeyRound className="size-4" />
                      )}
                      {isSignup ? "Sign up" : "Continue"} with {provider.name}
                    </Button>
                  </form>
                ))}
              </div>

              {hasCredentials ? (
                <form action={isSignup ? handleSignUp : handleSignIn} className="mt-6 space-y-3">
                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-slate-700" htmlFor="email">
                      Email
                    </label>
                    <input
                      className="h-11 rounded-lg border border-slate-200 px-3 text-sm outline-none transition focus:border-emerald-700/60 focus:ring-4 focus:ring-emerald-700/10"
                      id="email"
                      name="email"
                      placeholder="you@example.com"
                      type="email"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <label
                      className="text-sm font-medium text-slate-700"
                      htmlFor="password"
                    >
                      Password
                    </label>
                    <input
                      className="h-11 rounded-lg border border-slate-200 px-3 text-sm outline-none transition focus:border-emerald-700/60 focus:ring-4 focus:ring-emerald-700/10"
                      id="password"
                      name="password"
                      type="password"
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    className="h-11 w-full rounded-lg bg-emerald-700 text-white hover:bg-emerald-800"
                  >
                    {isSignup ? "Create account" : "Sign in"}
                  </Button>
                </form>
              ) : null}

              {enabledAuthProviders.length === 0 ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
                  Authentication is not configured yet. Add a provider before using Calmindra.
                </div>
              ) : null}
            </div>

            <p className="mt-5 text-center text-xs leading-5 text-slate-500">
              By continuing, you keep Calmindra tied to a private account session.
            </p>
          </section>
        </div>
      </section>
    </main>
  );
}

async function signInWithProvider(formData: FormData) {
  "use server";

  const provider = String(formData.get("provider") || "");
  if (!enabledAuthProviders.some((item) => item.id === provider)) return;

  await signIn(provider, { redirectTo: "/" });
}

async function handleSignIn(formData: FormData) {
  "use server";

  const email = String(formData.get("email") || "");
  const password = String(formData.get("password") || "");

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/",
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("NEXT_REDIRECT")) {
      throw error;
    }
    console.error("SignIn failed:", error);
    redirect("/sign-in?error=CredentialsSignin");
  }
}

async function handleSignUp(formData: FormData) {
  "use server";

  const email = String(formData.get("email") || "");
  const password = String(formData.get("password") || "");

  try {
    const backendUrl = process.env.BACKEND_URL || "http://localhost:8000";
    const res = await fetch(`${backendUrl}/auth/signup`, {
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
      const data = await res.json();
      const detail = data?.detail || "Registration failed.";
      redirect(`/sign-in?mode=signup&error=${encodeURIComponent(detail)}`);
    }

    // Automatically sign in the user upon successful registration
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/",
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("NEXT_REDIRECT")) {
      throw error;
    }
    console.error("SignUp failed:", error);
    redirect("/sign-in?mode=signup&error=Failed to register. Please try again.");
  }
}
