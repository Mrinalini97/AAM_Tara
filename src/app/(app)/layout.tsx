import { AppNav } from "@/components/AppNav";
import { createServerSupabase, isSupabaseConfigured } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function AppGroupLayout({ children }: { children: React.ReactNode }) {
  if (!isSupabaseConfigured()) redirect("/");
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return (
    <div className="min-h-screen">
      <AppNav />
      <div className="mx-auto max-w-3xl px-4 py-10">{children}</div>
    </div>
  );
}
