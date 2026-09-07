"use client";

import { acceptInvitation } from "@/app/actions/core";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function AcceptInvite({ token }: { token: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function accept() {
    setError(null);
    start(async () => {
      try {
        await acceptInvitation(token);
        router.push("/discover");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not accept invitation.");
      }
    });
  }

  return (
    <div className="mt-8">
      <Button type="button" onClick={accept} disabled={pending}>
        {pending ? "Joining…" : "Begin my reflection"}
      </Button>
      {error ? <p className="mt-3 text-sm text-clay">{error}</p> : null}
    </div>
  );
}
