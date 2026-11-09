"use client";

import { AuthForm } from "@/components/AuthForm";
import { useState } from "react";

export function GetStartedForm({
  initialMode = "signup",
  nextPath,
  serverError,
}: {
  initialMode?: "login" | "signup";
  nextPath: string;
  serverError?: string;
}) {
  const [mode, setMode] = useState<"login" | "signup">(initialMode);

  return (
    <div>
      <div className="flex border border-white/15">
        <button
          type="button"
          onClick={() => setMode("signup")}
          className={`flex-1 px-4 py-2 text-sm ${mode === "signup" ? "bg-flare text-ink" : "text-paper/70"}`}
        >
          Create account
        </button>
        <button
          type="button"
          onClick={() => setMode("login")}
          className={`flex-1 px-4 py-2 text-sm ${mode === "login" ? "bg-flare text-ink" : "text-paper/70"}`}
        >
          Sign in
        </button>
      </div>
      {serverError && mode === "login" ? <p className="mt-4 text-sm text-gold">{serverError}</p> : null}
      <div className="mt-8">
        <AuthForm key={mode} mode={mode} nextPath={nextPath} />
      </div>
    </div>
  );
}
