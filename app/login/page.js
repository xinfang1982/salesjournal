"use client";

import { signIn, useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function LoginContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

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
