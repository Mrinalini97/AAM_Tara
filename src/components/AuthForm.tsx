"use client";

import { createBrowserSupabase } from "@/lib/supabase/client";
import { authCallbackUrl, mapAuthError, validateDisplayName, validateEmail, validatePassword } from "@/lib/auth/validation";
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
  const [awaitingConfirm, setAwaitingConfirm] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (mode === "signup") {
      const nameError = validateDisplayName(name);
      if (nameError) {
        setError(nameError);
        return;
      }
    }
    const emailError = validateEmail(email);
    if (emailError) {
      setError(emailError);
      return;
    }
    const passwordError = validatePassword(password, { forSignup: mode === "signup" });
    if (passwordError) {
      setError(passwordError);
      return;
    }

    setLoading(true);
    try {
      const supabase = createBrowserSupabase();
      if (mode === "signup") {
        const { data, error: signError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { display_name: name.trim() },
            emailRedirectTo: authCallbackUrl(),
          },
        });
        if (signError) throw signError;
        if (data.user?.identities && data.user.identities.length === 0) {
          setError("An account with this email already exists. Sign in instead.");
          return;
        }
        if (!data.session) {
          setAwaitingConfirm(true);
          return;
        }
      } else {
        const { error: signError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (signError) throw signError;
      }
      router.push(nextPath);
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong.";
      setError(mapAuthError(message, mode));
    } finally {
      setLoading(false);
    }
  }

  if (awaitingConfirm) {
    return (
      <div className="mx-auto max-w-md space-y-4 border border-white/15 bg-white/5 px-6 py-8 text-center">
        <h2 className="font-serif text-2xl">Check your inbox</h2>
        <p className="text-sm text-paper/65">
          We sent a confirmation link to <span className="text-paper">{email.trim()}</span>. Open it to finish
          creating your account, then sign in. Until then, you are not logged in.
        </p>
        <p className="text-sm text-paper/65">If you do not see it, check spam or promotions.</p>
        <Link href="/login" className="inline-block text-sm text-flare underline">
          Go to sign in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-md space-y-4" noValidate>
      {mode === "signup" ? (
        <label className="block text-sm">
          <span className="text-paper/60">What should we call you?</span>
          <input
            required
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full border border-white/15 bg-white/5 px-4 py-3 text-paper outline-none focus:border-flare"
          />
        </label>
      ) : null}
      <label className="block text-sm">
        <span className="text-paper/60">Email</span>
        <input
          required
          type="email"
          autoComplete="email"
          inputMode="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full border border-white/15 bg-white/5 px-4 py-3 text-paper outline-none focus:border-flare"
        />
      </label>
      <label className="block text-sm">
        <span className="text-paper/60">Password</span>
        <input
          required
          type="password"
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 w-full border border-white/15 bg-white/5 px-4 py-3 text-paper outline-none focus:border-flare"
        />
        {mode === "signup" ? (
          <span className="mt-1 block text-xs text-paper/50">At least 8 characters, with a letter and a number.</span>
        ) : null}
      </label>
      {error ? <p className="text-sm text-gold">{error}</p> : null}
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Please wait…" : mode === "signup" ? "Create account" : "Sign in"}
      </Button>
      <p className="text-center text-sm text-paper/55">
        {mode === "signup" ? (
          <>
            Already have an account?{" "}
            <Link href="/login" className="text-flare underline">
              Sign in
            </Link>
          </>
        ) : (
          <>
            New here?{" "}
            <Link href="/signup" className="text-flare underline">
              Create an account
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
