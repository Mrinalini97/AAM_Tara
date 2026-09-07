import { createServerSupabase, isSupabaseConfigured } from "@/lib/supabase/server";
import { AcceptInvite } from "@/components/partner/AcceptInvite";
import { Logo } from "@/components/Logo";
import Link from "next/link";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  if (!isSupabaseConfigured()) {
    return (
      <div className="min-h-screen px-4 py-16 text-center">
        <Logo />
        <p className="mt-8 text-ink-soft">This project still needs Supabase environment variables.</p>
      </div>
    );
  }

  const supabase = await createServerSupabase();
  const { data: peek } = await supabase.rpc("peek_invitation", { invite_token: token });
  const row = Array.isArray(peek) ? peek[0] : peek;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!row) {
    return (
      <div className="min-h-screen px-4 py-16 text-center">
        <Logo />
        <h1 className="mt-10 font-serif text-3xl">This invitation is not available</h1>
        <p className="mt-3 text-ink-soft">The link may be incorrect, or it may have been withdrawn.</p>
        <Link href="/" className="mt-8 inline-block text-sage">
          Go to Tara
        </Link>
      </div>
    );
  }

  if (row.expired) {
    return (
      <div className="min-h-screen px-4 py-16 text-center">
        <Logo />
        <h1 className="mt-10 font-serif text-3xl">This invitation has expired</h1>
        <p className="mt-3 text-ink-soft">Ask them to send a new link.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-16">
      <div className="mx-auto max-w-xl text-center">
        <Logo />
        <p className="mt-10 text-xs uppercase tracking-[0.25em] text-sage">An invitation to reflect</p>
        <h1 className="mt-4 font-serif text-4xl leading-tight">
          {row.inviter_display_name
            ? `${row.inviter_display_name} invited you to complete your own reflection`
            : "You’ve been invited to complete your own reflection"}
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-ink-soft">
          You will not see their answers before you finish. The aim is an independent picture of what
          matters to you — then a shared conversation, not a score.
        </p>
        {user ? (
          <AcceptInvite token={token} />
        ) : (
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href={`/signup?next=/invite/${token}`}
              className="rounded-full bg-sage px-6 py-3 text-paper"
            >
              Create an account
            </Link>
            <Link href={`/login?next=/invite/${token}`} className="rounded-full border border-line px-6 py-3">
              Sign in
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
