import { createServerSupabase } from "@/lib/supabase/server";
import { InvitePanel } from "@/components/partner/InvitePanel";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function PartnerPage() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/partner");

  const { data: rel } = await supabase
    .from("relationship_profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  const { data: invitation } = await supabase
    .from("partner_invitations")
    .select("*")
    .or(`inviter_id.eq.${user.id},invitee_id.eq.${user.id}`)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  if (!rel) {
    return (
      <div>
        <h1 className="font-serif text-4xl">Ready to understand each other?</h1>
        <p className="mt-4 text-ink-soft">
          Complete your own reflection first. A partner should meet you as an independent voice, not as
          someone filling in the blanks of your answers.
        </p>
        <Link href="/discover" className="mt-6 inline-block rounded-full bg-sage px-5 py-2.5 text-paper">
          Complete my reflection
        </Link>
      </div>
    );
  }

  const isInviter = invitation?.inviter_id === user.id;
  const link = invitation ? `${appUrl}/invite/${invitation.token}` : null;

  return (
    <div>
      <p className="text-xs uppercase tracking-[0.25em] text-sage">Partner</p>
      <h1 className="mt-3 font-serif text-4xl">Ready to understand each other?</h1>
      <p className="mt-4 max-w-xl text-lg leading-relaxed text-ink-soft">
        Invite someone you’re considering as a life partner. They’ll complete their own reflection
        independently. They will not see your answers before they finish.
      </p>

      <InvitePanel existingLink={isInviter ? link : null} status={invitation?.status ?? null} />

      {invitation?.status === "accepted" ? (
        <p className="mt-6 text-ink-soft">
          Your invitation has been accepted. You’ll see shared insights once both reflections are
          complete.
        </p>
      ) : null}

      {invitation?.status === "ready" ? (
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/understand-us" className="rounded-full bg-sage px-5 py-2.5 text-paper">
            Understand us
          </Link>
          <Link href="/conversations" className="rounded-full border border-line px-5 py-2.5">
            Conversation guide
          </Link>
        </div>
      ) : null}

      {invitation && !isInviter ? (
        <p className="mt-6 text-sm text-ink-soft">You joined through an invitation. Shared insights appear when both of you have finished.</p>
      ) : null}
    </div>
  );
}
