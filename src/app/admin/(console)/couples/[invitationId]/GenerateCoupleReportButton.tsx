"use client";

import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function GenerateCoupleReportButton({
  invitationId,
  label,
}: {
  invitationId: string;
  label: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function run() {
    setPending(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/couples/${invitationId}`, { method: "POST" });
      const body = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(body.error ?? "Could not generate the couple report.");
        return;
      }
      router.refresh();
    } catch {
      setError("Could not reach the couple-report endpoint.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button type="button" onClick={run} disabled={pending}>
        {pending ? "Generating…" : label}
      </Button>
      {error ? <p className="text-sm text-clay">{error}</p> : null}
    </div>
  );
}
