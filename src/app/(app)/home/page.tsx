import { createServerSupabase } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, { data: assessment }, { data: invitation }] = await Promise.all([
    supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle(),
    supabase.from("assessments").select("status").eq("user_id", user.id).maybeSingle(),
    supabase
      .from("partner_invitations")
      .select("status")
      .or(`inviter_id.eq.${user.id},invitee_id.eq.${user.id}`)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const completed = assessment?.status === "completed";

  return (
    <div>
      <p className="text-xs uppercase tracking-[0.25em] text-sage">Home</p>
      <h1 className="mt-3 font-serif text-4xl">{profile?.display_name ? `Hello, ${profile.display_name}.` : "Hello."}</h1>
      <p className="mt-4 max-w-xl text-lg text-ink-soft">
        This is a private place to understand yourself, and later to understand a prospective partner —
        without a score, and without being told what to decide.
      </p>
      <div className="mt-10 grid gap-4">
        <Link href={completed ? "/reflection" : "/discover"} className="rounded-3xl border border-line bg-white/50 p-6">
          <p className="text-sm text-sage">{completed ? "Complete" : "Next"}</p>
          <h2 className="mt-1 font-serif text-2xl">{completed ? "Your reflection" : "Begin your reflection"}</h2>
        </Link>
        <Link href="/partner" className="rounded-3xl border border-line bg-white/50 p-6">
          <h2 className="font-serif text-2xl">Understand each other</h2>
          <p className="mt-2 text-ink-soft">Invite someone to complete their own reflection independently.</p>
        </Link>
        {invitation?.status === "ready" ? (
          <Link href="/understand-us" className="rounded-3xl border border-line bg-white/50 p-6">
            <h2 className="font-serif text-2xl">Where you align — and differ</h2>
          </Link>
        ) : null}
      </div>
    </div>
  );
}
