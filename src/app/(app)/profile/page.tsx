import { createServerSupabase } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("display_name").eq("id", user.id).single();
  const { data: assessment } = await supabase.from("assessments").select("status").eq("user_id", user.id).maybeSingle();

  return (
    <div>
      <p className="text-xs uppercase tracking-[0.25em] text-sage">My profile</p>
      <h1 className="mt-3 font-serif text-4xl">{profile?.display_name ?? "Your profile"}</h1>
      <dl className="mt-8 space-y-4 text-ink-soft">
        <div>
          <dt className="text-sm">Email</dt>
          <dd className="text-ink">{user.email}</dd>
        </div>
        <div>
          <dt className="text-sm">Reflection</dt>
          <dd className="text-ink">{assessment?.status === "completed" ? "Completed" : "In progress or not started"}</dd>
        </div>
      </dl>
      <div className="mt-8 flex gap-3">
        <Link href="/reflection" className="rounded-full bg-sage px-5 py-2.5 text-sm text-paper">
          View reflection
        </Link>
        <Link href="/settings" className="rounded-full border border-line px-5 py-2.5 text-sm">
          Settings
        </Link>
      </div>
    </div>
  );
}
