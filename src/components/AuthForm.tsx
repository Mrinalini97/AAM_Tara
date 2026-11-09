"use client";

import { createBrowserSupabase } from "@/lib/supabase/client";
import {
  authCallbackUrl,
  mapAuthError,
  safeNextPath,
  validateAge,
  validateDisplayName,
  validateEmail,
  validatePassword,
  validateUsername,
} from "@/lib/auth/validation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";

const AUTH_NEXT_COOKIE = "tara_auth_next";

function rememberNext(path: string) {
  document.cookie = `${AUTH_NEXT_COOKIE}=${encodeURIComponent(path)}; Path=/; Max-Age=3600; SameSite=Lax`;
}

const fieldClass =
  "mt-1 w-full border border-white/15 bg-white/5 px-4 py-3 text-paper outline-none focus:border-flare";

export function AuthForm({ mode, nextPath = "/home" }: { mode: "login" | "signup"; nextPath?: string }) {
  const router = useRouter();
  const destination = safeNextPath(nextPath, mode === "signup" ? "/discover" : "/home");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [awaitingConfirm, setAwaitingConfirm] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

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

    if (mode === "signup") {
      const nameError = validateDisplayName(name);
      if (nameError) {
        setError(nameError);
        return;
      }
      const ageError = validateAge(age);
      if (ageError) {
        setError(ageError);
        return;
      }
      const usernameError = validateUsername(username);
      if (usernameError) {
        setError(usernameError);
        return;
      }
      if (password !== confirmPassword) {
        setError("Those passwords do not match.");
        return;
      }
    }

    setLoading(true);
    try {
      const supabase = createBrowserSupabase();
      if (mode === "signup") {
        rememberNext(destination);
        const { data, error: signError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              display_name: name.trim(),
              age: Number(age),
              username: username.trim().toLowerCase(),
            },
            emailRedirectTo: authCallbackUrl(destination),
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
      router.push(destination);
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
          signing in. You will return to the page you were opening. Until you open it, you are not logged in.
        </p>
        <p className="text-sm text-paper/65">If you do not see it, check spam or promotions.</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-md space-y-4" noValidate>
      {mode === "signup" ? (
        <>
          <label className="block text-sm">
            <span className="text-paper/60">Full name</span>
            <input
              required
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={fieldClass}
            />
          </label>
          <label className="block text-sm">
            <span className="text-paper/60">Age</span>
            <input
              required
              inputMode="numeric"
              autoComplete="bday-year"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              className={fieldClass}
            />
          </label>
          <label className="block text-sm">
            <span className="text-paper/60">Username</span>
            <input
              required
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={fieldClass}
            />
          </label>
        </>
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
          className={fieldClass}
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
          className={fieldClass}
        />
        {mode === "signup" ? (
          <span className="mt-1 block text-xs text-paper/50">At least 8 characters, with a letter and a number.</span>
        ) : null}
      </label>
      {mode === "signup" ? (
        <label className="block text-sm">
          <span className="text-paper/60">Confirm password</span>
          <input
            required
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={fieldClass}
          />
        </label>
      ) : null}
      {error ? <p className="text-sm text-gold">{error}</p> : null}
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Please wait…" : mode === "signup" ? "Create account" : "Sign in"}
      </Button>
    </form>
  );
}
