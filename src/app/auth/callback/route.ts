import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

function safeNextPath(next: string | null): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return "/home";
  return next;
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const authError = searchParams.get("error_description") ?? searchParams.get("error");
  const next = safeNextPath(searchParams.get("next"));

  if (authError) {
    const login = new URL("/login", origin);
    login.searchParams.set("error", authError);
    return NextResponse.redirect(login);
  }

  if (code) {
    const supabase = await createServerSupabase();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      const login = new URL("/login", origin);
      login.searchParams.set("error", error.message);
      return NextResponse.redirect(login);
    }
    return NextResponse.redirect(`${origin}${next}`);
  }

  const login = new URL("/login", origin);
  login.searchParams.set("error", "Missing confirmation code. Request a new link from sign in.");
  return NextResponse.redirect(login);
}
