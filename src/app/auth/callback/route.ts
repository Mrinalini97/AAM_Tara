import { NextResponse } from "next/server";
import { safeNextPath } from "@/lib/auth/validation";
import { createServerSupabase } from "@/lib/supabase/server";

const AUTH_NEXT_COOKIE = "tara_auth_next";

function destinationFrom(request: Request): string {
  const { searchParams } = new URL(request.url);
  const fromQuery = searchParams.get("next");
  if (fromQuery) return safeNextPath(fromQuery);
  const cookie = request.headers
    .get("cookie")
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${AUTH_NEXT_COOKIE}=`))
    ?.slice(AUTH_NEXT_COOKIE.length + 1);
  if (!cookie) return "/home";
  try {
    return safeNextPath(decodeURIComponent(cookie));
  } catch {
    return "/home";
  }
}

function redirectTo(url: string | URL) {
  const response = NextResponse.redirect(url);
  response.cookies.set(AUTH_NEXT_COOKIE, "", { path: "/", maxAge: 0 });
  return response;
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const authError = searchParams.get("error_description") ?? searchParams.get("error");
  const next = destinationFrom(request);

  if (authError) {
    const login = new URL("/login", origin);
    login.searchParams.set("error", authError);
    login.searchParams.set("next", next);
    return redirectTo(login);
  }

  if (code) {
    const supabase = await createServerSupabase();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      const login = new URL("/login", origin);
      login.searchParams.set("error", error.message);
      login.searchParams.set("next", next);
      return redirectTo(login);
    }
    return redirectTo(`${origin}${next}`);
  }

  const login = new URL("/login", origin);
  login.searchParams.set("error", "Missing confirmation code. Request a new link from sign in.");
  login.searchParams.set("next", next);
  return redirectTo(login);
}
