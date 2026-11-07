const EMAIL_PATTERN =
  /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$/;

const RESERVED_DOMAINS = new Set([
  "example.com",
  "example.net",
  "example.org",
  "test.com",
  "test.org",
  "invalid",
  "localhost",
  "local",
]);

export function validateDisplayName(name: string): string | null {
  const trimmed = name.trim();
  if (trimmed.length < 2) return "Please enter a name (at least 2 characters).";
  if (trimmed.length > 80) return "That name is a bit long — try something shorter.";
  return null;
}

export function validateEmail(raw: string): string | null {
  const email = raw.trim();
  if (!email) return "Enter your email address.";
  if (email.length > 254) return "That email address is too long.";
  if (email.includes(" ") || email.includes("..")) return "Enter a complete, valid email address.";
  if (!EMAIL_PATTERN.test(email)) {
    return "Enter a complete email (for example, you@domain.com).";
  }

  const [local, domain] = email.toLowerCase().split("@");
  if (!local || !domain) return "Enter a complete, valid email address.";
  if (local.startsWith(".") || local.endsWith(".")) return "Enter a complete, valid email address.";

  const labels = domain.split(".");
  const tld = labels.at(-1) ?? "";
  if (labels.length < 2 || tld.length < 2 || !/^[a-z]{2,}$/.test(tld)) {
    return "Enter a complete email, including a real domain (the part after @).";
  }

  if (RESERVED_DOMAINS.has(domain) || labels.some((label) => label === "localhost")) {
    return "Please use a real email you can check — we send a confirmation link there.";
  }

  return null;
}

export function validatePassword(password: string, { forSignup }: { forSignup: boolean }): string | null {
  if (password.length < 8) return "Use at least 8 characters for your password.";
  if (password.length > 72) return "Passwords can be at most 72 characters.";
  if (!forSignup) return null;
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    return "Choose a password with at least one letter and one number.";
  }
  if (/^(.)\1+$/.test(password)) return "Choose a password that is not a repeated character.";
  return null;
}

export function mapAuthError(message: string, mode: "login" | "signup"): string {
  const lower = message.toLowerCase();
  if (lower.includes("email not confirmed") || lower.includes("not confirmed")) {
    return "This email is not confirmed yet. Open the link we sent, then sign in.";
  }
  if (lower.includes("invalid login credentials") || lower.includes("invalid credentials")) {
    return "That email and password did not match. Check both, or create an account if you are new.";
  }
  if (lower.includes("user not found") || lower.includes("no user")) {
    return "We could not find an account with that email.";
  }
  if (lower.includes("already registered") || lower.includes("already been registered")) {
    return "An account with this email already exists. Sign in instead.";
  }
  if (lower.includes("password")) {
    return message;
  }
  if (mode === "signup" && lower.includes("rate")) {
    return "Too many attempts. Please wait a moment and try again.";
  }
  return message || "Something went wrong. Please try again.";
}

export function safeNextPath(next: string | null | undefined, fallback = "/home"): string {
  if (!next) return fallback;
  const value = next.trim();
  if (!value || value.length > 512) return fallback;
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return fallback;
  let decoded = value;
  try {
    decoded = decodeURIComponent(value);
  } catch {
    return fallback;
  }
  const pathname = decoded.split("?")[0] ?? "";
  if (!pathname.startsWith("/") || pathname.startsWith("//") || pathname.includes("\\") || pathname.includes("://") || decoded.includes("\0")) {
    return fallback;
  }
  if (["/auth", "/login", "/signup"].some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) return fallback;
  return decoded;
}

export function authCallbackUrl(nextPath?: string): string {
  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "http://localhost:3000";
  const url = new URL("/auth/callback", origin);
  if (nextPath) url.searchParams.set("next", safeNextPath(nextPath));
  return url.toString();
}
