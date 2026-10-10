"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { adminLogin } from "../actions";

export function AdminLoginForm() {
  const [state, action, pending] = useActionState(adminLogin, null);

  return (
    <form action={action} className="mx-auto max-w-md space-y-4">
      <label className="block text-sm">
        <span className="text-ink-soft">Username</span>
        <input
          required
          name="username"
          autoComplete="username"
          className="mt-1 w-full rounded-2xl border border-line bg-white/70 px-4 py-3 outline-none focus:border-sage"
        />
      </label>
      <label className="block text-sm">
        <span className="text-ink-soft">Password</span>
        <input
          required
          type="password"
          name="password"
          autoComplete="current-password"
          className="mt-1 w-full rounded-2xl border border-line bg-white/70 px-4 py-3 outline-none focus:border-sage"
        />
      </label>
      {state?.error ? <p className="text-sm text-clay">{state.error}</p> : null}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
