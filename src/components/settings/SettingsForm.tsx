"use client";

import { deleteAccountData, restartAssessment, updateDisplayName } from "@/app/actions/core";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function SettingsForm({ displayName, email }: { displayName: string; email: string }) {
  const router = useRouter();
  const [name, setName] = useState(displayName);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <div className="mt-10 space-y-10">
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          start(async () => {
            await updateDisplayName(name);
            setMessage("Name saved.");
          });
        }}
      >
        <label className="block text-sm">
          <span className="text-ink-soft">Display name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-2xl border border-line bg-white/70 px-4 py-3 outline-none focus:border-sage"
          />
        </label>
        <p className="text-sm text-ink-soft">{email}</p>
        <Button type="submit" disabled={pending}>
          Save
        </Button>
      </form>

      <div>
        <h2 className="font-serif text-2xl">Sign out</h2>
        <Button
          type="button"
          variant="secondary"
          className="mt-3"
          onClick={async () => {
            const supabase = createBrowserSupabase();
            await supabase.auth.signOut();
            router.push("/");
            router.refresh();
          }}
        >
          Sign out
        </Button>
      </div>

      <div>
        <h2 className="font-serif text-2xl">Start the reflection again</h2>
        <p className="mt-2 text-sm text-ink-soft">
          This clears your answers and generated profile. It does not delete your account.
        </p>
        <Button
          type="button"
          variant="secondary"
          className="mt-3"
          disabled={pending}
          onClick={() =>
            start(async () => {
              await restartAssessment();
              router.push("/discover");
            })
          }
        >
          Restart reflection
        </Button>
      </div>

      <div>
        <h2 className="font-serif text-2xl">Delete my data</h2>
        <p className="mt-2 text-sm text-ink-soft">
          Removes your profile, answers, invitations, and generated insights from this app. Sign-in
          records in Supabase Auth may remain unless a service role key is configured on the server.
        </p>
        <Button
          type="button"
          variant="danger"
          className="mt-3"
          disabled={pending}
          onClick={() => {
            if (!confirm("Delete your profile and all responses? This cannot be undone.")) return;
            start(async () => {
              await deleteAccountData();
              router.push("/");
              router.refresh();
            });
          }}
        >
          Delete account and responses
        </Button>
      </div>

      {message ? <p className="text-sm text-sage">{message}</p> : null}
    </div>
  );
}
