"use client";

import { useState, useTransition } from "react";
import { createPartnerInvitation } from "@/app/actions/core";
import { Button } from "@/components/ui/Button";

export function InvitePanel({
  existingLink,
  status,
}: {
  existingLink: string | null;
  status: string | null;
}) {
  const [link, setLink] = useState(existingLink);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [pending, start] = useTransition();

  function create() {
    setError(null);
    start(async () => {
      try {
        const invitation = await createPartnerInvitation();
        const origin = window.location.origin;
        setLink(`${origin}/invite/${invitation.token}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not create invitation.");
      }
    });
  }

  async function copy() {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="mt-8 rounded-3xl border border-line bg-white/50 p-6">
      {link ? (
        <>
          <p className="text-sm text-ink-soft">Share this private link. Do not post it publicly.</p>
          <p className="mt-3 break-all rounded-2xl bg-paper-deep px-4 py-3 text-sm">{link}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button type="button" onClick={copy}>
              {copied ? "Copied" : "Copy link"}
            </Button>
          </div>
          {status === "pending" ? (
            <p className="mt-4 text-sm text-ink-soft">Waiting for them to begin — independently.</p>
          ) : null}
        </>
      ) : (
        <Button type="button" onClick={create} disabled={pending}>
          {pending ? "Creating…" : "Invite a Partner"}
        </Button>
      )}
      {error ? <p className="mt-3 text-sm text-clay">{error}</p> : null}
    </div>
  );
}
