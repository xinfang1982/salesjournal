"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function LoginContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [credError, setCredError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleCredentialsLogin(e) {
    e.preventDefault();
    setCredError("");
    setLoading(true);
    try {
      const csrfRes = await fetch("/api/auth/csrf");
      const { csrfToken } = await csrfRes.json();

      await fetch("/api/auth/callback/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ username, password, csrfToken }),
        redirect: "manual",
      });

      // Check if session was created
      const sessionRes = await fetch("/api/auth/session");
      const session = await sessionRes.json();

      if (session?.user) {
        window.location.href = "/";
      } else {
        setCredError("Invalid username or password.");
      }
    } catch {
      setCredError("Sign in failed. Please try again.");
    }
    setLoading(false);
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-white p-8">
      <div className="w-full max-w-sm">
        <h1 className="text-4xl font-bold text-black text-center mb-2">
          SalesJournal
        </h1>
        <p className="text-gray-500 text-center text-base mb-10">
          Sign in to continue
        </p>

        {error === "AccessDenied" && (
          <div className="border-2 border-black bg-gray-100 text-black text-base font-semibold px-4 py-4 rounded-xl mb-6 text-center">
            This Google account is not authorised to access SalesJournal.
            <br />
            <span className="font-normal text-sm text-gray-600">Please try a different account.</span>
          </div>
        )}

        {/* Username / Password */}
        <form onSubmit={handleCredentialsLogin} className="mb-6">
          <div className="mb-4">
            <label className="block text-black font-semibold text-base mb-1">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full border-2 border-gray-800 rounded-xl px-4 py-3 text-black text-lg focus:outline-none focus:border-black"
              placeholder="Username"
              autoComplete="username"
            />
          </div>
          <div className="mb-4">
            <label className="block text-black font-semibold text-base mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border-2 border-gray-800 rounded-xl px-4 py-3 text-black text-lg focus:outline-none focus:border-black"
              placeholder="Password"
              autoComplete="current-password"
            />
          </div>

          {credError && (
            <p className="text-black font-semibold text-base mb-4 text-center border-2 border-black px-4 py-2 rounded-xl bg-gray-100">
              {credError}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full border-2 border-black bg-black text-white font-semibold text-xl py-4 rounded-xl hover:bg-gray-900 transition disabled:opacity-50"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-0.5 bg-gray-300" />
          <span className="text-gray-500 text-sm font-medium">or</span>
          <div className="flex-1 h-0.5 bg-gray-300" />
        </div>

        {/* Google */}
        <button
          onClick={() => signIn("google", { callbackUrl: "/", prompt: "select_account" })}
          className="w-full border-2 border-gray-800 bg-white text-black font-semibold text-xl py-4 rounded-xl hover:bg-gray-100 transition"
        >
          Sign in with Google
        </button>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}
