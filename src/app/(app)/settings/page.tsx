import { createServerSupabase } from "@/lib/supabase/server";
import { SettingsForm } from "@/components/settings/SettingsForm";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/settings");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .single();

  return (
    <div>
      <p className="text-xs uppercase tracking-[0.25em] text-sage">Settings</p>
      <h1 className="mt-3 font-serif text-4xl">Your space</h1>
      <p className="mt-3 max-w-xl text-ink-soft">
        Questionnaire responses are treated as sensitive. You can update your name, sign out, or delete
        your data.
      </p>
      <SettingsForm displayName={profile?.display_name ?? ""} email={user.email ?? ""} />
    </div>
  );
}
