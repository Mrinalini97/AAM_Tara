"use client";

import { createBrowserSupabase } from "@/lib/supabase/client";
import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";

export function AuthForm({ mode, nextPath = "/home" }: { mode: "login" | "signup"; nextPath?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const supabase = createBrowserSupabase();
      if (mode === "signup") {
        const { error: signError } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { display_name: name } },
        });
        if (signError) throw signError;
      } else {
        const { error: signError } = await supabase.auth.signInWithPassword({ email, password });
        if (signError) throw signError;
      }
      router.push(nextPath);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-md space-y-4">
      {mode === "signup" ? (
        <label className="block text-sm">
          <span className="text-ink-soft">What should we call you?</span>
          <input required value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full rounded-2xl border border-line bg-white/70 px-4 py-3 outline-none focus:border-sage" />
        </label>
      ) : null}
      <label className="block text-sm">
        <span className="text-ink-soft">Email</span>
        <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full rounded-2xl border border-line bg-white/70 px-4 py-3 outline-none focus:border-sage" />
      </label>
      <label className="block text-sm">
        <span className="text-ink-soft">Password</span>
        <input required type="password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full rounded-2xl border border-line bg-white/70 px-4 py-3 outline-none focus:border-sage" />
      </label>
      {error ? <p className="text-sm text-clay">{error}</p> : null}
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Please wait…" : mode === "signup" ? "Create account" : "Sign in"}
      </Button>
      <p className="text-center text-sm text-ink-soft">
        {mode === "signup" ? (
          <>
            Already have an account?{" "}
            <Link href="/login" className="text-ink underline">
              Sign in
            </Link>
          </>
        ) : (
          <>
            New here?{" "}
            <Link href="/signup" className="text-ink underline">
              Create an account
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
